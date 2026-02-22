import React from 'react';

const StreamHeader = ({ greeting }) => {
    return (
        <div className="stream-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                    <span className="welcome-text">{greeting}</span>
                    <h1 className="stream-title">My Lessons</h1>
                </div>
            </div>
        </div>
    );
};

export default StreamHeader;
