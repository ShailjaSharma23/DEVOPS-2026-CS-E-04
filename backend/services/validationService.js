const fs = require('fs');

/**
 * Service to validate and verify ingested CSV dataset files against ASTRA schemas.
 */
class ValidationService {
  /**
   * Validates dataset file based on category
   * @param {string} filePath - Absolute path to the CSV file
   * @param {string} category - 'demographic' | 'biometric' | 'resource'
   * @returns {Promise<{isValid: boolean, rowCount: number, errorCount: number, warningCount: number, messages: string[], validRows: any[]}>}
   */
  static async validateCSV(filePath, category) {
    const messages = [];
    let errorCount = 0;
    let warningCount = 0;
    let rowCount = 0;
    const validRows = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length === 0) {
        return {
          isValid: false,
          rowCount: 0,
          errorCount: 1,
          warningCount: 0,
          messages: ['Empty file content'],
          validRows: []
        };
      }

      // Check headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const schema = this.getSchemaForCategory(category);
      
      const missingHeaders = schema.requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        return {
          isValid: false,
          rowCount: 0,
          errorCount: 1,
          warningCount: 0,
          messages: [`Missing required CSV columns: [${missingHeaders.join(', ')}]`],
          validRows: []
        };
      }

      // Read row entries
      for (let i = 1; i < lines.length; i++) {
        rowCount++;
        const row = lines[i].split(',').map(v => v.trim());
        
        // Check column count match
        if (row.length !== headers.length) {
          errorCount++;
          if (errorCount <= 10) {
            messages.push(`Row ${i + 1}: Column count mismatch. Expected ${headers.length}, found ${row.length}.`);
          }
          continue;
        }

        // Map row to keys
        const data = {};
        headers.forEach((h, idx) => {
          data[h] = row[idx];
        });

        // Run validation rules
        const rowErrors = this.validateRow(data, category, i + 1);
        if (rowErrors.length > 0) {
          errorCount++;
          if (errorCount <= 10) {
            messages.push(...rowErrors);
          }
        } else {
          validRows.push(data);
        }
      }

      // Cap message logs
      if (errorCount > 10) {
        messages.push(`...and ${errorCount - 10} more row errors truncated.`);
      }

      const qualityScore = rowCount > 0 ? ((rowCount - errorCount) / rowCount) * 100 : 0;

      return {
        isValid: errorCount === 0,
        rowCount,
        errorCount,
        warningCount,
        qualityScore: parseFloat(qualityScore.toFixed(2)),
        messages,
        validRows
      };

    } catch (error) {
      return {
        isValid: false,
        rowCount: 0,
        errorCount: 1,
        warningCount: 0,
        messages: [`System file parsing error: ${error.message}`],
        validRows: []
      };
    }
  }

  static getSchemaForCategory(category) {
    switch (category) {
      case 'demographic':
        return {
          requiredHeaders: ['state', 'district', 'age_band', 'gender', 'period', 'count']
        };
      case 'biometric':
        return {
          requiredHeaders: ['state', 'district', 'type', 'age_band', 'period', 'count']
        };
      case 'resource':
        return {
          requiredHeaders: ['state', 'district', 'resource_name', 'period', 'allocated', 'utilized']
        };
      default:
        throw new Error('Unknown category type');
    }
  }

  static validateRow(data, category, rowNum) {
    const errors = [];

    // Common fields validation: state & district
    if (!data.state) errors.push(`Row ${rowNum}: State value is empty`);
    if (!data.district) errors.push(`Row ${rowNum}: District value is empty`);

    // Date/Period validation (Format YYYY-MM)
    if (!data.period || !/^\d{4}-\d{2}$/.test(data.period)) {
      errors.push(`Row ${rowNum}: Invalid period format [${data.period}]. Expected YYYY-MM.`);
    }

    if (category === 'demographic') {
      // Age Band validation
      const ageBands = ['0-5', '5-18', '18-35', '35-60', '60+'];
      if (!ageBands.includes(data.age_band)) {
        errors.push(`Row ${rowNum}: Invalid age_band [${data.age_band}]. Valid: [${ageBands.join(', ')}]`);
      }

      // Gender validation
      const genders = ['M', 'F', 'O'];
      if (!genders.includes(data.gender.toUpperCase())) {
        errors.push(`Row ${rowNum}: Invalid gender [${data.gender}]. Valid: M, F, O.`);
      }

      // Count validation
      const count = parseInt(data.count);
      if (isNaN(count) || count < 0) {
        errors.push(`Row ${rowNum}: Invalid count [${data.count}]. Must be a non-negative integer.`);
      }
    }

    if (category === 'biometric') {
      // Type validation (enrollment / update)
      const types = ['enrollment', 'update'];
      if (!types.includes(data.type.toLowerCase())) {
        errors.push(`Row ${rowNum}: Invalid biometric type [${data.type}]. Valid: enrollment, update.`);
      }

      // Age Band
      const ageBands = ['0-5', '5-18', '18-35', '35-60', '60+'];
      if (!ageBands.includes(data.age_band)) {
        errors.push(`Row ${rowNum}: Invalid age_band [${data.age_band}]`);
      }

      // Count
      const count = parseInt(data.count);
      if (isNaN(count) || count < 0) {
        errors.push(`Row ${rowNum}: Invalid count [${data.count}].`);
      }
    }

    if (category === 'resource') {
      if (!data.resource_name) {
        errors.push(`Row ${rowNum}: Resource name is empty.`);
      }

      const allocated = parseInt(data.allocated);
      const utilized = parseInt(data.utilized);

      if (isNaN(allocated) || allocated < 0) {
        errors.push(`Row ${rowNum}: Allocated amount [${data.allocated}] must be non-negative.`);
      }
      if (isNaN(utilized) || utilized < 0) {
        errors.push(`Row ${rowNum}: Utilized amount [${data.utilized}] must be non-negative.`);
      }
      if (!isNaN(allocated) && !isNaN(utilized) && utilized > allocated) {
        // Warning or error? PRD says non-negative check. Let's make it a warning indicator or allowed, sometimes utilization spikes above nominal allocation if buffers are used. We'll allow it but flag extreme values.
      }
    }

    return errors;
  }
}

module.exports = ValidationService;
