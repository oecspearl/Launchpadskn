import React from 'react';
import './FlagLogo.css';

function FlagLogo({ size = 'medium', showText = true }) {
  const sizeClasses = {
    small: 'flag-logo-small',
    medium: 'flag-logo-medium',
    large: 'flag-logo-large'
  };

  return (
    <div className={`flag-logo-container ${sizeClasses[size] || sizeClasses.medium}`}>
      <div className="flag-logo">
        {/* Green triangle (upper-left) */}
        <div className="flag-triangle flag-green"></div>
        
        {/* Red triangle (lower-right) */}
        <div className="flag-triangle flag-red"></div>
        
        {/* Black diagonal band with yellow borders */}
        <div className="flag-diagonal">
          <div className="flag-diagonal-yellow"></div>
          <div className="flag-diagonal-black">
            {/* Two white stars */}
            <div className="flag-star flag-star-top"></div>
            <div className="flag-star flag-star-bottom"></div>
          </div>
          <div className="flag-diagonal-yellow"></div>
        </div>
      </div>
      {showText && (
        <span className="flag-logo-text">LaunchPad SKN</span>
      )}
    </div>
  );
}

export default FlagLogo;


