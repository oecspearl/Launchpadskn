import React from 'react';
import ThemeSelector from '../ThemeSelector';
import './StreamComponents.css';

const StreamHeader = ({ greeting, theme, onThemeChange }) => {
    return (
        <div className="stream-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                    <span className="welcome-text">{greeting}</span>
                    <h1 className="stream-title">StreamHub</h1>
                </div>
                {theme && onThemeChange && (
                    <ThemeSelector currentTheme={theme} onThemeChange={onThemeChange} />
                )}
            </div>
        </div>
    );
};

export default StreamHeader;
