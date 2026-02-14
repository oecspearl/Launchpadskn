import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { FaPalette, FaMoon, FaSun, FaAdjust, FaEye } from 'react-icons/fa';

const THEMES = [
    {
        id: 'cool-dark',
        name: 'Cool Dark',
        icon: FaMoon,
        description: 'Soft blue tones, easy on the eyes'
    },
    {
        id: 'warm-dark',
        name: 'Warm Dark',
        icon: FaAdjust,
        description: 'Warm orange tones, cozy feel'
    },
    {
        id: 'light',
        name: 'Light Mode',
        icon: FaSun,
        description: 'Bright and clear'
    },
    {
        id: 'high-contrast',
        name: 'High Contrast',
        icon: FaEye,
        description: 'Maximum visibility'
    }
];

function ThemeSelector({ currentTheme, onThemeChange }) {
    const activeTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
    const ActiveIcon = activeTheme.icon;

    return (
        <Dropdown align="end">
            <Dropdown.Toggle
                variant="outline-secondary"
                id="theme-selector"
                style={{
                    background: 'var(--theme-glass)',
                    border: '1px solid var(--theme-glass-border)',
                    color: 'var(--theme-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                }}
            >
                <FaPalette />
                <span className="d-none d-md-inline">{activeTheme.name}</span>
            </Dropdown.Toggle>

            <Dropdown.Menu
                style={{
                    background: 'var(--theme-card-bg)',
                    border: '1px solid var(--theme-glass-border)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    minWidth: '250px',
                    backdropFilter: 'blur(20px)'
                }}
            >
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Choose Theme
                </div>
                {THEMES.map((theme) => {
                    const Icon = theme.icon;
                    const isActive = theme.id === currentTheme;

                    return (
                        <Dropdown.Item
                            key={theme.id}
                            onClick={() => onThemeChange(theme.id)}
                            style={{
                                background: isActive ? 'var(--theme-primary)' : 'transparent',
                                color: isActive ? 'white' : 'var(--theme-text)',
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                margin: '0.25rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Icon style={{ fontSize: '1.25rem', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
                                    {theme.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: isActive ? 0.9 : 0.7 }}>
                                    {theme.description}
                                </div>
                            </div>
                            {isActive && (
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    flexShrink: 0
                                }} />
                            )}
                        </Dropdown.Item>
                    );
                })}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default ThemeSelector;
