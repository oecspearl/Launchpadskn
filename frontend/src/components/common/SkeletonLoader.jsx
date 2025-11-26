import React from 'react';
import './SkeletonLoader.css';

/**
 * SkeletonLoader - Reusable skeleton loading component
 * Provides content-aware loading states with shimmer animation
 * 
 * @param {string} variant - Type of skeleton: 'card', 'list', 'text', 'circle', 'dashboard'
 * @param {number} count - Number of skeleton items to render (for list/text variants)
 * @param {number} height - Custom height in pixels
 * @param {number} width - Custom width (percentage or pixels)
 * @param {string} className - Additional CSS classes
 */
const SkeletonLoader = ({
    variant = 'card',
    count = 1,
    height,
    width,
    className = ''
}) => {
    const renderSkeleton = () => {
        switch (variant) {
            case 'card':
                return (
                    <div className={`skeleton-card ${className}`} style={{ height, width }}>
                        <div className="skeleton-card-image"></div>
                        <div className="skeleton-card-body">
                            <div className="skeleton-text skeleton-title"></div>
                            <div className="skeleton-text skeleton-subtitle"></div>
                            <div className="skeleton-text skeleton-line"></div>
                        </div>
                    </div>
                );

            case 'list':
                return Array.from({ length: count }).map((_, idx) => (
                    <div key={idx} className={`skeleton-list-item ${className}`} style={{ height, width }}>
                        <div className="skeleton-circle"></div>
                        <div className="skeleton-list-content">
                            <div className="skeleton-text skeleton-title"></div>
                            <div className="skeleton-text skeleton-subtitle"></div>
                        </div>
                    </div>
                ));

            case 'text':
                return Array.from({ length: count }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`skeleton-text ${className}`}
                        style={{ height: height || '16px', width: width || '100%' }}
                    ></div>
                ));

            case 'circle':
                return (
                    <div
                        className={`skeleton-circle ${className}`}
                        style={{
                            width: width || height || '50px',
                            height: height || width || '50px'
                        }}
                    ></div>
                );

            case 'dashboard':
                return (
                    <div className={`skeleton-dashboard ${className}`}>
                        {/* Header */}
                        <div className="skeleton-dashboard-header">
                            <div className="skeleton-text skeleton-title" style={{ width: '300px' }}></div>
                            <div className="skeleton-text skeleton-subtitle" style={{ width: '200px' }}></div>
                        </div>

                        {/* Stats Cards */}
                        <div className="skeleton-stats-grid">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="skeleton-stat-card">
                                    <div className="skeleton-text" style={{ width: '60px', height: '40px' }}></div>
                                    <div className="skeleton-text" style={{ width: '100px' }}></div>
                                </div>
                            ))}
                        </div>

                        {/* Main Content */}
                        <div className="skeleton-dashboard-content">
                            <div className="skeleton-dashboard-main">
                                <div className="skeleton-text skeleton-title" style={{ width: '200px' }}></div>
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <div key={idx} className="skeleton-list-item">
                                        <div className="skeleton-circle"></div>
                                        <div className="skeleton-list-content">
                                            <div className="skeleton-text skeleton-title"></div>
                                            <div className="skeleton-text skeleton-subtitle"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="skeleton-dashboard-sidebar">
                                <div className="skeleton-card">
                                    <div className="skeleton-text skeleton-title"></div>
                                    <div className="skeleton-text skeleton-line"></div>
                                    <div className="skeleton-text skeleton-line"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div className={`skeleton ${className}`} style={{ height, width }}></div>;
        }
    };

    return <div className="skeleton-wrapper">{renderSkeleton()}</div>;
};

export default SkeletonLoader;
