import React from 'react';

const SKNFlagLogo = ({ width = 36, height = 24 }) => (
  <svg width={width} height={height} viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg" aria-label="SKN Flag">
    <rect width="36" height="24" fill="#009e60"/>
    <polygon points="0,24 36,0 36,24" fill="#c8001e"/>
    <rect x="0" y="0" width="36" height="24" fill="none"/>
    <polygon points="0,18 0,24 36,6 36,0" fill="#000" opacity="0.85"/>
    <line x1="0" y1="16" x2="36" y2="4" stroke="#fcd116" strokeWidth="2"/>
    <line x1="0" y1="20" x2="36" y2="8" stroke="#fcd116" strokeWidth="2"/>
    <polygon points="10,10 10.8,12.5 13.5,12.5 11.3,14 12.2,16.5 10,15 7.8,16.5 8.7,14 6.5,12.5 9.2,12.5"
      fill="white" transform="scale(0.65)" style={{transformOrigin:'10px 13px'}}/>
    <polygon points="26,10 26.8,12.5 29.5,12.5 27.3,14 28.2,16.5 26,15 23.8,16.5 24.7,14 22.5,12.5 25.2,12.5"
      fill="white" transform="scale(0.65)" style={{transformOrigin:'26px 13px'}}/>
  </svg>
);

export default SKNFlagLogo;
