import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Card, Alert, Spinner, Modal, Form, ButtonGroup } from 'react-bootstrap';
import { FaDownload, FaTrash, FaEdit, FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileAlt } from 'react-icons/fa';
import supabaseService from '../../services/supabaseService';
import { formatDistanceToNow } from 'date-fns';

const FileList = ({ courseId, classSubjectId, fileType, refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [fileToEdit, setFileToEdit] = useState(null);
  const [editFileType, setEditFileType] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);

  // Define fetchFiles as a useCallback to avoid dependency issues
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // List files from Supabase Storage
      const bucketName = 'lesson-files';
      const folderPath = classSubjectId 
        ? `class-subjects/${classSubjectId}`
        : 'general';
      
      const filesData = await supabaseService.listFiles(bucketName, folderPath);
      
      // Transform to expected format
      const formattedFiles = (filesData || []).map((file, index) => ({
        id: file.name || index,
        name: file.name,
        url: file.publicUrl || file.url,
        fileType: fileType || file.name.split('.').pop(),
        uploadedAt: file.createdAt || new Date().toISOString(),
        size: file.size || 0
      }));

      setFiles(formattedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError(error.message || 'Failed to load files. Please try again later.');
      setFiles([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [classSubjectId, fileType]);

  // Fetch files when component mounts or refreshTrigger changes
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshTrigger]);



  const handleDownload = (downloadUrl) => {
    window.open(downloadUrl, '_blank');
  };

  const confirmDelete = (file) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      // Delete file from Supabase Storage
      const bucketName = 'lesson-files';
      const filePath = fileToDelete.name || fileToDelete.id;
      
      await supabaseService.deleteFile(bucketName, filePath);

      // Remove file from state
      setFiles(files.filter(file => file.id !== fileToDelete.id));
      setShowDeleteModal(false);
      setFileToDelete(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(error.message || 'Failed to delete file. Please try again later.');
      setShowDeleteModal(false);
    }
  };

  const openEditModal = (file) => {
    setFileToEdit(file);
    setEditFileType(file.fileType);
    setEditIsPublic(file.isPublic);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await axios.put(
        `http://localhost:9090/files/${fileToEdit.id}`,
        null,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            fileType: editFileType,
            isPublic: editIsPublic
          }
        }
      );

      // Update file in state
      setFiles(files.map(file => 
        file.id === fileToEdit.id ? { ...file, ...response.data } : file
      ));
      
      setShowEditModal(false);
      setFileToEdit(null);
    } catch (error) {
      console.error('Error updating file:', error);
      setError(error.response?.data?.error || 
               error.message || 
               'Failed to update file. Please try again later.');
      setShowEditModal(false);
    }
  };

  // Helper function to get file icon based on content type
  const getFileIcon = (contentType) => {
    if (contentType?.includes('pdf')) {
      return <FaFilePdf className="text-danger" />;
    } else if (contentType?.includes('word') || contentType?.includes('document')) {
      return <FaFileWord className="text-primary" />;
    } else if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) {
      return <FaFileExcel className="text-success" />;
    } else if (contentType?.includes('image')) {
      return <FaFileImage className="text-warning" />;
    } else {
      return <FaFileAlt className="text-secondary" />;
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading files...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>
          <FaFile className="me-2" />
          {fileType ? `${fileType.replace('_', ' ')} Files` : 'All Files'}
        </Card.Title>
        
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
        
        {files.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No files found.
          </Alert>
        ) : (
          <div className="table-responsive mt-3">
            <Table hover>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id}>
                    <td className="align-middle">
                      <div className="d-flex align-items-center">
                        {getFileIcon(file.contentType)}
                        <div className="ms-2">
                          <h6 className="mb-0">{file.originalFileName}</h6>
                          <small className="text-muted">{file.contentType}</small>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle">
                      <Badge bg={file.isPublic ? "success" : "secondary"}>
                        {file.isPublic ? "Public" : "Private"}
                      </Badge>
                    </td>
                    <td className="align-middle">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="align-middle">
                      {formatDistanceToNow(new Date(file.uploadDate), { addSuffix: true })}
                    </td>
                    <td className="align-middle">
                      <Badge bg="primary">
                        {file.fileType.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="align-middle">
                      <ButtonGroup size="sm">
                        <Button 
                          variant="outline-primary" 
                          onClick={() => handleDownload(file.downloadUrl)}
                          title="Download"
                        >
                          <FaDownload />
                        </Button>
                        <Button 
                          variant="outline-info" 
                          onClick={() => openEditModal(file)}
                          title="Edit"
                          disabled={file.uploadedBy.userId !== localStorage.getItem('userId') && !localStorage.getItem('role') === 'ADMIN'}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          onClick={() => confirmDelete(file)}
                          title="Delete"
                          disabled={file.uploadedBy.userId !== localStorage.getItem('userId') && !localStorage.getItem('role') === 'ADMIN'}
                        >
                          <FaTrash />
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {fileToDelete && (
            <p>
              Are you sure you want to delete the file <strong>{fileToDelete.originalFileName}</strong>?
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit File Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {fileToEdit && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>File Name</Form.Label>
                <Form.Control
                  type="text"
                  value={fileToEdit.originalFileName}
                  disabled
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>File Type</Form.Label>
                <Form.Select
                  value={editFileType}
                  onChange={(e) => setEditFileType(e.target.value)}
                >
                  <option value="COURSE_MATERIAL">Course Material</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="SUBMISSION">Submission</option>
                  <option value="PROFILE_PICTURE">Profile Picture</option>
                  <option value="OTHER">Other</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Public (visible to all course participants)"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default FileList;
