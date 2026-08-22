import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Datasets = () => {
  const { user, hasPermission } = useAuth();
  const [datasets, setDatasets] = useState([
    { id: 'D-8021', name: 'mh_demographics_q2_2026.csv', category: 'Demographics', rowCount: '412,410', qualityScore: '99.8%', date: '2026-08-10 14:24', status: 'Ready' },
    { id: 'D-8020', name: 'up_biometrics_2026_07.csv', category: 'Biometrics', rowCount: '1,894,200', qualityScore: '98.4%', date: '2026-08-08 09:12', status: 'Ready' },
    { id: 'D-8019', name: 'tn_kits_allocations_2026.csv', category: 'Resource Allocation', rowCount: '84,102', qualityScore: '100.0%', date: '2026-08-05 16:50', status: 'Ready' },
    { id: 'D-8018', name: 'ka_demographics_corrupted.csv', category: 'Demographics', rowCount: '0', qualityScore: '0.0%', date: '2026-08-01 11:05', status: 'Failed' }
  ]);

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadDetails, setUploadDetails] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('Uploaded');
  const [category, setCategory] = useState('demographic');

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      triggerUpload(e.target.files[0].name);
    }
  };

  const triggerUpload = (name) => {
    setFileName(name);
    setUploading(true);
    setUploadPercent(0);
    setStatus('Uploaded');
    setUploadDetails('Transferring data blocks...');

    let percent = 0;
    const interval = setInterval(() => {
      percent += 10;
      setUploadPercent(percent);
      if (percent >= 30 && percent < 60) {
        setStatus('Validating');
        setUploadDetails('Verifying variable headers and state code ranges...');
      } else if (percent >= 60 && percent < 100) {
        setStatus('Processing');
        setUploadDetails('Aggregating indices by demographic groups...');
      } else if (percent >= 100) {
        clearInterval(interval);
        completeIngestion(name);
      }
    }, 150);
  };

  const completeIngestion = (name) => {
    const isCorrupt = name.includes('corrupt') || name.includes('bad');
    const newId = `D-${8018 + datasets.length + 1}`;
    
    let newEntry;
    if (isCorrupt) {
      setStatus('Failed');
      setUploadDetails('Ingestion stopped: Missing required schema headers.');
      newEntry = {
        id: newId,
        name: name,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        rowCount: '0',
        qualityScore: '0.0%',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Failed'
      };
    } else {
      setStatus('Ready');
      setUploadDetails('Aggregated dataset persisted successfully to MongoDB.');
      newEntry = {
        id: newId,
        name: name,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        rowCount: '124,500',
        qualityScore: '99.9%',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Ready'
      };
    }

    setDatasets(prev => [newEntry, ...prev]);
  };

  const canUpload = hasPermission('upload_datasets');

  return (
    <div>
      <div className="alert-banner">
        <i className="fa-solid fa-info-circle"></i>
        <div>
          <h4>Ingestion Engine Status</h4>
          <p>
            Anonymized aggregate files must end in <span className="text-code">.csv</span>. The ingestion process verifies columns dynamically and drops invalid state-codes.
          </p>
        </div>
      </div>

      {canUpload && (
        <div className="visual-card" style={{ marginBottom: '32px' }}>
          <div className="visual-card-title">Upload Aggregated Dataset</div>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dataset Category:</label>
            <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="demographic">Demographics Data</option>
              <option value="biometric">Biometrics Data</option>
              <option value="resource">Resource Allocations</option>
            </select>
          </div>

          <div className="upload-zone" onClick={() => document.getElementById('file-input-field').click()}>
            <i className="fa-solid fa-cloud-arrow-up upload-icon"></i>
            <div className="upload-title">Ingest Aggregation Records</div>
            <div className="upload-hint">Drag & drop CSV files here or click to browse.</div>
            <input type="file" id="file-input-field" style={{ display: 'none' }} accept=".csv" onChange={handleFileChange} />
          </div>

          {uploading && (
            <div style={{ marginTop: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600 }}>{fileName}</span>
                <span className={`status-badge ${status === 'Ready' ? 'ready' : status === 'Failed' ? 'failed' : 'processing'}`}>
                  {status}
                </span>
              </div>
              <div className="progress-wrapper">
                <div className="progress-bar" style={{ width: `${uploadPercent}%` }}></div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {uploadDetails}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="visual-card">
        <div className="visual-card-title">
          <span>Historical Ingested Datasets</span>
          <i className="fa-solid fa-clock-rotate-left text-muted"></i>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="astra-table">
            <thead>
              <tr>
                <th>Dataset ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Rows</th>
                <th>Quality Score</th>
                <th>Ingested At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map(d => (
                <tr key={d.id}>
                  <td className="text-code">{d.id}</td>
                  <td style={{ fontWeight: 500 }}>{d.name}</td>
                  <td>{d.category}</td>
                  <td>{d.rowCount}</td>
                  <td className="text-code">{d.qualityScore}</td>
                  <td className="text-code" style={{ fontSize: '0.8rem' }}>{d.date}</td>
                  <td>
                    <span className={`status-badge ${d.status === 'Ready' ? 'ready' : 'failed'}`}>
                      <i className={d.status === 'Ready' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'}></i>{' '}
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Datasets;
