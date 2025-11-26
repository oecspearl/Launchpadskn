import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaTimes, FaDownload, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './FilePreviewModal.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * FilePreviewModal Component
 * Preview files (PDF, images, videos) in a modal
 * 
 * @param {boolean} show - Show/hide modal
 * @param {Function} onHide - Close callback
 * @param {Object} file - File object { url, name, type }
 * @param {Array} files - Array of files for navigation
 * @param {number} currentIndex - Current file index
 */
const FilePreviewModal = ({
    show,
    onHide,
    file,
    files = [],
    currentIndex = 0,
    onNavigate = null
}) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    };

    const onDocumentLoadError = (error) => {
        console.error('PDF load error:', error);
        setError('Failed to load PDF');
        setLoading(false);
    };

    const handlePreviousPage = () => {
        setPageNumber(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setPageNumber(prev => Math.min(prev + 1, numPages));
    };

    const handlePreviousFile = () => {
        if (onNavigate && currentIndex > 0) {
            onNavigate(currentIndex - 1);
            setPageNumber(1);
            setLoading(true);
        }
    };

    const handleNextFile = () => {
        if (onNavigate && currentIndex < files.length - 1) {
            onNavigate(currentIndex + 1);
            setPageNumber(1);
            setLoading(true);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name || 'download';
        link.click();
    };

    const renderPreview = () => {
        if (!file) return null;

        const fileType = file.type || '';

        // PDF Preview
        if (fileType === 'application/pdf' || file.url?.endsWith('.pdf')) {
            return (
                <div className="pdf-preview-container">
                    {loading && (
                        <div className="preview-loading">
                            <Spinner animation="border" variant="primary" />
                            <p>Loading PDF...</p>
                        </div>
                    )}
                    {error && (
                        <div className="preview-error">
                            <p>{error}</p>
                        </div>
                    )}
                    <Document
                        file={file.url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading=""
                    >
                        <Page
                            pageNumber={pageNumber}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="pdf-page"
                        />
                    </Document>
                    {numPages && (
                        <div className="pdf-controls">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handlePreviousPage}
                                disabled={pageNumber <= 1}
                            >
                                <FaChevronLeft />
                            </Button>
                            <span className="page-info">
                                Page {pageNumber} of {numPages}
                            </span>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={pageNumber >= numPages}
                            >
                                <FaChevronRight />
                            </Button>
                        </div>
                    )}
                </div>
            );
        }

        // Image Preview
        if (fileType.startsWith('image/')) {
            return (
                <div className="image-preview-container">
                    <img
                        src={file.url}
                        alt={file.name}
                        className="preview-image"
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setError('Failed to load image');
                            setLoading(false);
                        }}
                    />
                    {loading && (
                        <div className="preview-loading">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    )}
                </div>
            );
        }

        // Video Preview
        if (fileType.startsWith('video/')) {
            return (
                <div className="video-preview-container">
                    <video
                        src={file.url}
                        controls
                        className="preview-video"
                        onLoadedData={() => setLoading(false)}
                        onError={() => {
                            setError('Failed to load video');
                            setLoading(false);
                        }}
                    >
                        Your browser does not support the video tag.
                    </video>
                    {loading && (
                        <div className="preview-loading">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    )}
                </div>
            );
        }

        // Audio Preview
        if (fileType.startsWith('audio/')) {
            return (
                <div className="audio-preview-container">
                    <audio
                        src={file.url}
                        controls
                        className="preview-audio"
                        onLoadedData={() => setLoading(false)}
                    >
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            );
        }

        // Fallback for unsupported types
        return (
            <div className="unsupported-preview">
                <p>Preview not available for this file type</p>
                <Button variant="primary" onClick={handleDownload}>
                    <FaDownload className="me-2" />
                    Download File
                </Button>
            </div>
        );
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            className="file-preview-modal"
        >
            <Modal.Header className="border-0 pb-0">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="d-flex align-items-center gap-2">
                        <Modal.Title className="mb-0">{file?.name || 'File Preview'}</Modal.Title>
                        {files.length > 1 && (
                            <span className="text-muted small">
                                ({currentIndex + 1} of {files.length})
                            </span>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={handleDownload}>
                            <FaDownload />
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={onHide}>
                            <FaTimes />
                        </Button>
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body>
                {renderPreview()}
            </Modal.Body>
            {files.length > 1 && (
                <Modal.Footer className="justify-content-between border-0 pt-0">
                    <Button
                        variant="outline-secondary"
                        onClick={handlePreviousFile}
                        disabled={currentIndex <= 0}
                    >
                        <FaChevronLeft className="me-2" />
                        Previous File
                    </Button>
                    <Button
                        variant="outline-secondary"
                        onClick={handleNextFile}
                        disabled={currentIndex >= files.length - 1}
                    >
                        Next File
                        <FaChevronRight className="ms-2" />
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
};

export default FilePreviewModal;
