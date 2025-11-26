import React, { useState, useCallback } from 'react';
import { Card, ProgressBar, Button, Alert } from 'react-bootstrap';
import { FaUpload, FaFile, FaTimes, FaCheck } from 'react-icons/fa';
import { formatFileSize, getFileIcon, validateFileType, validateFileSize } from '../../services/fileService';
import './FileUploadZone.css';

/**
 * FileUploadZone Component
 * Drag-and-drop file upload with validation and progress tracking
 * 
 * @param {Function} onUpload - Callback when files are ready (receives File array)
 * @param {Array<string>} acceptedTypes - Allowed MIME types
 * @param {number} maxSizeMB - Maximum file size in MB
 * @param {boolean} multiple - Allow multiple files
 * @param {string} folder - Upload folder path
 */
const FileUploadZone = ({
    onUpload,
    acceptedTypes = ['*/*'],
    maxSizeMB = 10,
    multiple = true,
    folder = 'uploads',
    label = 'Drag & drop files here, or click to browse'
}) => {
    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');

    // Handle drag events
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setError('');

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback((e) => {
        setError('');
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    }, []);

    // Process files
    const handleFiles = (fileList) => {
        const fileArray = Array.from(fileList);
        const validFiles = [];
        const errors = [];

        fileArray.forEach(file => {
            // Validate type
            if (acceptedTypes[0] !== '*/*' && !validateFileType(file, acceptedTypes)) {
                errors.push(`${file.name}: Invalid file type`);
                return;
            }

            // Validate size
            if (!validateFileSize(file, maxSizeMB)) {
                errors.push(`${file.name}: File too large (max ${maxSizeMB}MB)`);
                return;
            }

            validFiles.push({
                file,
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: file.size,
                type: file.type,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                status: 'ready'
            });
        });

        if (errors.length > 0) {
            setError(errors.join(', '));
        }

        if (validFiles.length > 0) {
            const newFiles = multiple ? [...files, ...validFiles] : validFiles;
            setFiles(newFiles);

            if (onUpload) {
                onUpload(newFiles.map(f => f.file), folder);
            }
        }
    };

    // Remove file
    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
    };

    // Clear all files
    const clearAll = () => {
        setFiles([]);
        setError('');
    };

    return (
        <div className="file-upload-zone-container">
            <Card className="file-upload-zone">
                <div
                    className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input').click()}
                >
                    <FaUpload className="upload-icon" />
                    <p className="upload-text">{label}</p>
                    <p className="upload-hint">
                        {acceptedTypes[0] === '*/*'
                            ? `Maximum file size: ${maxSizeMB}MB`
                            : `Accepted: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')} (max ${maxSizeMB}MB)`
                        }
                    </p>
                    <input
                        id="file-input"
                        type="file"
                        multiple={multiple}
                        accept={acceptedTypes.join(',')}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>
            </Card>

            {error && (
                <Alert variant="danger" className="mt-3" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {files.length > 0 && (
                <Card className="mt-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Selected Files ({files.length})</span>
                        <Button variant="link" size="sm" onClick={clearAll} className="text-danger">
                            Clear All
                        </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <div className="file-list">
                            {files.map(fileItem => (
                                <div key={fileItem.id} className="file-item">
                                    <div className="file-info">
                                        {fileItem.preview ? (
                                            <img src={fileItem.preview} alt={fileItem.name} className="file-thumbnail" />
                                        ) : (
                                            <div className="file-icon">
                                                <FaFile />
                                            </div>
                                        )}
                                        <div className="file-details">
                                            <div className="file-name">{fileItem.name}</div>
                                            <div className="file-size">{formatFileSize(fileItem.size)}</div>
                                        </div>
                                    </div>
                                    <div className="file-actions">
                                        {fileItem.status === 'ready' && (
                                            <FaCheck className="text-success me-2" />
                                        )}
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-danger p-0"
                                            onClick={() => removeFile(fileItem.id)}
                                        >
                                            <FaTimes />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default FileUploadZone;
