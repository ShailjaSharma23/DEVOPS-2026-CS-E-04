import React, { useState } from 'react';

const Users = () => {
  const [personnel, setPersonnel] = useState([
    { name: 'Admin Chief', email: 'admin@uidai.gov.in', role: 'Administrator', dept: 'UIDAI Central Head Office' },
    { name: 'Ananya Sen', email: 'a.sen@nic.in', role: 'Data Analyst', dept: 'National Analytics Cell' },
    { name: 'R. Subramanian', email: 'r.subra@nic.in', role: 'Resource Planning Officer', dept: 'Regional Resource Division' },
    { name: 'Devendra Pratap', email: 'd.pratap@gov.in', role: 'Department Officer', dept: 'Ministry of Electronics & IT' }
  ]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [dept, setDept] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    let displayRole = 'Data Analyst';
    if (role === 'planning_officer') displayRole = 'Resource Planning Officer';
    if (role === 'department_officer') displayRole = 'Department Officer';

    const newUser = { name, email, role: displayRole, dept };
    setPersonnel(prev => [...prev, newUser]);
    
    // Clear forms
    setName('');
    setEmail('');
    setDept('');
  };

  const handleDeactivate = (index) => {
    setPersonnel(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="grid-2col">
      <div className="visual-card">
        <div className="visual-card-title">
          <span>Create Internal User Account</span>
          <i className="fa-solid fa-user-plus text-muted"></i>
        </div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="filter-group">
              <label htmlFor="p-name">Full Name</label>
              <input
                type="text"
                id="p-name"
                className="filter-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Inspector R. Sharma"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="p-email">Government Email</label>
              <input
                type="email"
                id="p-email"
                className="filter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. r.sharma@nic.in"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="p-role">Assigned Access Role</label>
              <select
                className="filter-select"
                id="p-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="analyst">Data Analyst</option>
                <option value="planning_officer">Resource Planning Officer</option>
                <option value="department_officer">Department Officer</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="p-dept">Department / Office</label>
              <input
                type="text"
                id="p-dept"
                className="filter-input"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                required
                placeholder="e.g. UIDAI Regional Office West"
              />
            </div>
            <div>
              <button type="submit" className="btn">
                <i className="fa-solid fa-user-check"></i> Provision User
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="visual-card">
        <div className="visual-card-title">
          <span>Active Internal Personnel Registry</span>
          <i className="fa-solid fa-address-book text-muted"></i>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="astra-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Dept</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((p, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.email}</div>
                  </td>
                  <td><span className="text-code">{p.role}</span></td>
                  <td>{p.dept}</td>
                  <td>
                    {p.role !== 'Administrator' && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--status-failed)' }}
                        onClick={() => handleDeactivate(index)}
                      >
                        Deactivate
                      </button>
                    )}
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

export default Users;
