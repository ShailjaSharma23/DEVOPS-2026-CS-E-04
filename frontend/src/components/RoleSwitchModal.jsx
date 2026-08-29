import React from 'react';

const RoleSwitchModal = ({ isOpen, onClose, targetRole, currentRole, onConfirmSignOut }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <i className="fa-solid fa-shield-halved" style={{ color: 'var(--accent-color)' }}></i>
            <span>Switch access level?</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
            You are currently signed in as:
          </p>
          <div className="role-current-box" style={{ margin: '10px 0', padding: '10px 14px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontWeight: '700', color: 'var(--accent-color)' }}>
            {currentRole || 'User'}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
            To access <strong>{targetRole || "this role's"}</strong> permissions, you must sign out of the current session and sign in again using an authorized account.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirmSignOut}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Yes, sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSwitchModal;
