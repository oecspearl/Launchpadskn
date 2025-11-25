import React from 'react';
import './LoadingSkeleton.css';

/**
 * Generic skeleton placeholder used while data is loading.
 * Accepts optional height and width to match the shape of the real component.
 */
export default function LoadingSkeleton({ height = 20, width = '100%' }) {
    return (
        <div
            className="loading-skeleton"
            style={{ height, width, marginBottom: '0.5rem' }}
        />
    );
}
