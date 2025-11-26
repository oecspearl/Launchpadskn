import React from 'react';
import './StreamComponents.css';

const StreamHeader = ({ greeting }) => {
    return (
        <div className="stream-header">
            <span className="welcome-text">{greeting}</span>
            <h1 className="stream-title">StreamHub</h1>
        </div>
    );
};

export default StreamHeader;
