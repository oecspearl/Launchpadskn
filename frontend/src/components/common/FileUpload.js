import React, { useState } from 'react';
import { Form, Button, ProgressBar, Alert, Card } from 'react-bootstrap';
import { FaUpload, FaFileAlt, FaTrash } from 'react-icons/fa';
import axios from 'axios';

const FileUpload = ({ courseId, fileType, onUploadSuccess, isPublic = false }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fileType', fileType);
    if (courseId) {
      formData.append('courseId', courseId);
    }
    formData.append('isPublic', isPublic);

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Upload file with progress tracking
      const response = await axios.post('http://localhost:9090/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setSuccess('File uploaded successfully!');
      setSelectedFile(null);
      
      // Call the callback function if provided
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 
               error.message || 
               'Failed to upload file. Please try again later.');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setError('');
    setSuccess('');
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Card.Title>
          <FaUpload className="me-2" />
          Upload File
        </Card.Title>
        
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mt-3">
            {success}
          </Alert>
        )}
        
        <Form onSubmit={handleUpload}>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Select a file to upload</Form.Label>
            <Form.Control 
              type="file" 
              onChange={handleFileChange}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
            />
            <Form.Text className="text-muted">
              Maximum file size: 10MB. Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF
            </Form.Text>
          </Form.Group>
          
          {selectedFile && (
            <div className="mb-3">
              <div className="d-flex align-items-center">
                <FaFileAlt className="me-2 text-primary" />
                <span className="text-truncate">{selectedFile.name}</span>
                <small className="ms-2 text-muted">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</small>
              </div>
            </div>
          )}
          
          {uploading && (
            <ProgressBar 
              now={uploadProgress} 
              label={`${uploadProgress}%`} 
              className="mb-3" 
              animated
            />
          )}
          
          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={!selectedFile || uploading}
              className="flex-grow-1"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            
            {selectedFile && !uploading && (
              <Button 
                variant="outline-secondary" 
                onClick={cancelUpload}
                className="flex-grow-1"
              >
                <FaTrash className="me-1" />
                Cancel
              </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FileUpload;
