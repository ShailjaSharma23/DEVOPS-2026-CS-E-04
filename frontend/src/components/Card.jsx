import React from 'react';

const Card = ({ title, icon, desc, children }) => {
  return (
    <div className="visual-card">
      <div className="visual-card-title">
        <span>{title}</span>
        {icon && <i className={`${icon} text-muted`}></i>}
      </div>
      {desc && <p className="visual-card-desc">{desc}</p>}
      {children}
    </div>
  );
};

export default Card;
