import React from 'react';

function SKNFlagLogo({ width = 36, height = 24 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg">
      {/* Green base */}
      <rect width="36" height="24" fill="var(--skn-green, #009e60)" />
      {/* Red triangle (bottom-right) */}
      <polygon points="16,0 36,0 36,24 20,24" fill="var(--skn-red, #c8001e)" />
      {/* Black diagonal band */}
      <polygon points="0,16 0,24 8,24 36,8 36,0 28,0" fill="var(--skn-black, #000)" />
      {/* Yellow border stripes */}
      <polygon points="0,14.5 0,16 28,0 26.5,0" fill="var(--skn-yellow, #fcd116)" />
      <polygon points="8,24 9.5,24 36,8 36,6.5" fill="var(--skn-yellow, #fcd116)" />
      {/* White stars */}
      <polygon points="12,14 12.7,16.2 15,16.2 13.2,17.6 13.8,19.8 12,18.4 10.2,19.8 10.8,17.6 9,16.2 11.3,16.2" fill="white" />
      <polygon points="22,8 22.7,10.2 25,10.2 23.2,11.6 23.8,13.8 22,12.4 20.2,13.8 20.8,11.6 19,10.2 21.3,10.2" fill="white" />
    </svg>
  );
}

export default SKNFlagLogo;
