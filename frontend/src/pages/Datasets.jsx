import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const Datasets = () => {
  const { user, hasPermission } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [category, setCategory] = useState('demographic');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('astra_token');
    try {
      const response = await fetch('/api/v1/datasets', {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDatasets(data);
        setIsLive(true);
      }
    } catch (err) {
      console.warn('Dataset listing fetch error:', err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadMessage('Uploading dataset to backend ingestion pipeline...');

    const token = localStorage.getItem('astra_token');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);
    formData.append('name', selectedFile.name);

    try {
      const response = await fetch('/api/v1/datasets/upload', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      if (response.ok) {
        setUploadMessage('Dataset uploaded successfully! Ingestion processing started in background.');
        setSelectedFile(null);
        setTimeout(() => {
          fetchDatasets();
          setUploadMessage('');
        }, 2000);
      } else {
        const errorData = await response.json();
        setUploadMessage(`Upload failed: ${errorData.error || 'Server rejected file'}`);
      }
    } catch (err) {
      setUploadMessage('Network error submitting dataset file to server.');
    } finally {
      setUploading(false);
    }
  };

  const canUpload = hasPermission('upload_datasets');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <span className={`status-badge ${isLive ? 'ready' : ''}`} style={{ backgroundColor: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isLive ? '#10b981' : '#f59e0b' }}>
          <i className={`fa-solid ${isLive ? 'fa-database' : 'fa-server'}`}></i> {isLive ? 'Live MongoDB Dataset Catalog' : 'Offline'}
        </span>
      </div>

      <div className="alert-banner">
        <i className="fa-solid fa-info-circle"></i>
        <div>
          <h4>Ingestion Engine Status</h4>
          <p>
            Anonymized aggregate files must end in <span className="text-code">.csv</span>. The ingestion process verifies schema headers dynamically, checks state codes, and prevents duplicate records.
          </p>
        </div>
      </div>

      {canUpload && (
        <div className="visual-card" style={{ marginBottom: '32px' }}>
          <div className="visual-card-title">Upload New Dataset</div>
          <form onSubmit={handleUploadSubmit} style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="filter-group">
                <label>Category</label>
                <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="demographic">Demographic Dataset</option>
                  <option value="biometric">Biometric Dataset</option>
                  <option value="resource">Resource Allocation Dataset</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="filter-input"
                  style={{ paddingTop: '8px' }}
                  required
                />
              </div>

              <button type="submit" className="btn" disabled={uploading || !selectedFile} style={{ height: '42px', marginBottom: '1px' }}>
                {uploading ? (
                  <span><i className="fa-solid fa-spinner fa-spin"></i> Ingesting...</span>
                ) : (
                  <span><i className="fa-solid fa-cloud-arrow-up"></i> Upload to Database</span>
                )}
              </button>
            </div>

            {uploadMessage && (
              <div style={{ marginTop: '14px', fontSize: '13px', color: uploadMessage.includes('failed') ? '#fca5a5' : '#86efac' }}>
                <i className={`fa-solid ${uploadMessage.includes('failed') ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i> {uploadMessage}
              </div>
            )}
          </form>
        </div>
      )}

      <div className="visual-card">
        <div className="visual-card-title">
          <span>Active Datasets in MongoDB</span>
          <button onClick={fetchDatasets} className="btn" style={{ padding: '4px 12px', fontSize: '12px' }}>
            <i className="fa-solid fa-rotate-right"></i> Refresh
          </button>
        </div>
        <p className="visual-card-desc">Managed dataset catalog loaded from MongoDB and physical disk storage.</p>

        <div style={{ overflowX: 'auto' }}>
          <table className="astra-table">
            <thead>
              <tr>
                <th>Dataset Name</th>
                <th>Category</th>
                <th>Row Count</th>
                <th>Quality Score</th>
                <th>Status</th>
                <th>Uploaded By</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {datasets.length > 0 ? (
                datasets.map((d) => (
                  <tr key={d._id}>
                    <td><strong>{d.name || d.sourceFileName}</strong></td>
                    <td>
                      <span className="status-badge" style={{ textTransform: 'capitalize' }}>
                        {d.category}
                      </span>
                    </td>
                    <td className="text-code">{typeof d.rowCount === 'number' ? d.rowCount.toLocaleString() : d.rowCount}</td>
                    <td className="text-code" style={{ color: d.qualityScore >= 95 ? '#10b981' : '#f59e0b' }}>
                      {d.qualityScore ? `${d.qualityScore}%` : '100%'}
                    </td>
                    <td>
                      <span className={`status-badge ${d.status === 'Ready' ? 'ready' : d.status === 'Failed' ? 'failed' : ''}`}>
                        {d.status || 'Ready'}
                      </span>
                    </td>
                    <td>{d.uploadedBy?.name || 'A.S.T.R.A. Admin'}</td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Initial Seed'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#a0aec0', padding: '24px' }}>
                    {loading ? 'Querying dataset catalog...' : 'No datasets registered in database.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Datasets;
