import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaUserPlus, FaTrash, FaKey, FaEdit, FaFileUpload, FaExclamationTriangle } from 'react-icons/fa';
import Papa from 'papaparse';
import supabaseService from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContextSupabase';

function UserManagement() {
    const { user } = useAuth(); // ensure admin
    const [users, setUsers] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'STUDENT', institution_id: '' });
    const [showReset, setShowReset] = useState(false);
    const [resetInfo, setResetInfo] = useState({
        userEmail: null,
        userId: null,
        password: '',
        resetMethod: 'email' // 'email' or 'direct'
    });

    // Bulk Upload State
    const [showBulk, setShowBulk] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkPreview, setBulkPreview] = useState([]);
    const [bulkResults, setBulkResults] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [u, i] = await Promise.all([
                supabaseService.getAllUsers(),
                supabaseService.getAllInstitutions(),
            ]);
            setUsers(u || []);
            setInstitutions(i || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddUser = async () => {
        try {
            // Validate SCHOOL_ADMIN requires institution
            if (newUser.role === 'SCHOOL_ADMIN' && !newUser.institution_id) {
                setError('Institution is required for School Admin role.');
                return;
            }

            await supabaseService.createUser(newUser);
            setShowAdd(false);
            setNewUser({ email: '', password: '', role: 'STUDENT', institution_id: '' });
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to create user');
        }
    };

    const handleResetPassword = async () => {
        try {
            setError(null);
            let result;

            if (resetInfo.resetMethod === 'direct') {
                // Direct password change
                if (!resetInfo.password || resetInfo.password.length < 6) {
                    setError('Password must be at least 6 characters long');
                    return;
                }
                if (!resetInfo.userId) {
                    setError('User ID is required for direct password change');
                    return;
                }
                result = await supabaseService.resetUserPasswordDirect(resetInfo.userId, resetInfo.password);
                setSuccess('Password changed successfully!');
            } else {
                // Email-based reset
                if (!resetInfo.userEmail) {
                    setError('Email is required');
                    return;
                }
                result = await supabaseService.resetUserPassword(resetInfo.userEmail);
                setSuccess(result.message || 'Password reset email sent successfully!');
            }

            setShowReset(false);
            setResetInfo({ userEmail: null, userId: null, password: '', resetMethod: 'email' });
            fetchData();
        } catch (err) {
            console.error(err);
            if (err.message?.includes('403') || err.message?.includes('not allowed')) {
                setError('Direct password change requires service role key. Please use email reset method or configure service role key.');
            } else {
                setError(err.message || 'Failed to reset password');
            }
        }
    };

    const handleAssignInstitution = async (userId, institutionId) => {
        try {
            await supabaseService.assignUserToInstitution(userId, institutionId);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to assign institution');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await supabaseService.deleteUser(userId);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to delete user');
        }
    };

    const handleForcePasswordChange = async (userId, currentStatus) => {
        try {
            await supabaseService.setForcePasswordChange(userId, !currentStatus);
            fetchData();
            setSuccess(`User will ${!currentStatus ? 'be forced' : 'no longer be forced'} to change password on next login.`);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to update force password change status');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await supabaseService.updateUserProfile(userId, { role: newRole });
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to update user role');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setBulkFile(file);
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setBulkPreview(results.data);
                },
                error: (err) => {
                    setError('Failed to parse CSV: ' + err.message);
                }
            });
        }
    };

    const processBulkUpload = async () => {
        if (!bulkPreview.length) return;

        setBulkLoading(true);
        try {
            const results = await supabaseService.bulkCreateUsers(bulkPreview);
            setBulkResults(results);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to process bulk upload');
        } finally {
            setBulkLoading(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2>User Management</h2>
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
            <Button variant="primary" className="mb-3 me-2" onClick={() => setShowAdd(true)}>
                <FaUserPlus className="me-2" /> Add User
            </Button>
            <Button variant="success" className="mb-3" onClick={() => setShowBulk(true)}>
                <FaFileUpload className="me-2" /> Bulk Upload (CSV)
            </Button>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Institution</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.user_id}>
                            <td>{u.name || '—'}</td>
                            <td>{u.email}</td>
                            <td>
                                <Form.Select
                                    size="sm"
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.user_id || u.id, e.target.value)}
                                    style={{ width: '130px' }}
                                >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                                    <option value="STUDENT">STUDENT</option>
                                </Form.Select>
                            </td>
                            <td>{u.institution?.institution_name || '—'}</td>
                            <td>
                                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => {
                                    if (!u.email && !u.id) {
                                        setError('User does not have required information for password reset.');
                                        return;
                                    }
                                    setResetInfo({
                                        userEmail: u.email || null,
                                        userId: u.id || null,
                                        password: '',
                                        resetMethod: 'email'
                                    });
                                    setShowReset(true);
                                }}>
                                    <FaKey /> Reset PW
                                </Button>
                                <Form.Select
                                    size="sm"
                                    className="d-inline-block w-auto me-2"
                                    value={u.institution_id || ''}
                                    onChange={e => handleAssignInstitution(u.user_id, e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {institutions.map(inst => (
                                        <option key={inst.institution_id} value={inst.institution_id}>{inst.name}</option>
                                    ))}
                                </Form.Select>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(u.user_id)}>
                                    <FaTrash />
                                </Button>
                                <Button
                                    variant={u.force_password_change ? "warning" : "outline-secondary"}
                                    size="sm"
                                    className="ms-2"
                                    title={u.force_password_change ? "Cancel Force Password Change" : "Force Password Change"}
                                    onClick={() => handleForcePasswordChange(u.user_id || u.id, u.force_password_change)}
                                >
                                    <FaExclamationTriangle />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Add User Modal */}
            <Modal show={showAdd} onHide={() => setShowAdd(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="email">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="password">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="role">
                            <Form.Label>Role</Form.Label>
                            <Form.Select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="ADMIN">ADMIN (Super Admin)</option>
                                <option value="SCHOOL_ADMIN">SCHOOL_ADMIN (School Admin)</option>
                                <option value="INSTRUCTOR">INSTRUCTOR</option>
                                <option value="STUDENT">STUDENT</option>
                            </Form.Select>
                            {newUser.role === 'SCHOOL_ADMIN' && (
                                <Form.Text className="text-warning">
                                    School Admin requires an institution assignment.
                                </Form.Text>
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="institution">
                            <Form.Label>Institution {newUser.role === 'SCHOOL_ADMIN' && <span className="text-danger">*</span>}</Form.Label>
                            <Form.Select
                                value={newUser.institution_id}
                                onChange={e => setNewUser({ ...newUser, institution_id: e.target.value })}
                                required={newUser.role === 'SCHOOL_ADMIN'}
                            >
                                <option value="">None</option>
                                {institutions.map(inst => (
                                    <option key={inst.institution_id} value={inst.institution_id}>{inst.name}</option>
                                ))}
                            </Form.Select>
                            {newUser.role === 'SCHOOL_ADMIN' && !newUser.institution_id && (
                                <Form.Text className="text-danger">
                                    Institution is required for School Admin role.
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleAddUser}>Create</Button>
                </Modal.Footer>
            </Modal>

            {/* Reset Password Modal */}
            <Modal show={showReset} onHide={() => setShowReset(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Reset Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Reset Method</Form.Label>
                            <Form.Select
                                value={resetInfo.resetMethod}
                                onChange={e => setResetInfo({ ...resetInfo, resetMethod: e.target.value, password: '' })}
                            >
                                <option value="email">Send Reset Email (Recommended)</option>
                                <option value="direct">Change Password Directly</option>
                            </Form.Select>
                        </Form.Group>

                        {resetInfo.resetMethod === 'email' ? (
                            <>
                                <p>This will send a password reset email to:</p>
                                <p><strong>{resetInfo.userEmail}</strong></p>
                                <p className="text-muted small">
                                    The user will receive an email with a link to reset their password.
                                    They can then set a new password themselves.
                                </p>
                            </>
                        ) : (
                            <>
                                <Form.Group className="mb-3" controlId="newPassword">
                                    <Form.Label>New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={resetInfo.password}
                                        onChange={e => setResetInfo({ ...resetInfo, password: e.target.value })}
                                        placeholder="Enter new password (min 6 characters)"
                                    />
                                    <Form.Text className="text-muted">
                                        Password will be changed immediately. User: <strong>{resetInfo.userEmail}</strong>
                                    </Form.Text>
                                </Form.Group>
                                <div className="alert alert-warning small">
                                    <strong>Note:</strong> Direct password change requires service role key configuration.
                                    If you see an error, use the email reset method instead.
                                </div>
                            </>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReset(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleResetPassword}>
                        {resetInfo.resetMethod === 'email' ? 'Send Reset Email' : 'Change Password'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Bulk Upload Modal */}
            <Modal show={showBulk} onHide={() => { setShowBulk(false); setBulkResults(null); setBulkFile(null); setBulkPreview([]); }} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Bulk User Upload</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!bulkResults ? (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Upload CSV File</Form.Label>
                                <Form.Control type="file" accept=".csv" onChange={handleFileUpload} />
                                <Form.Text className="text-muted">
                                    CSV should have headers: <strong>email, password, role, institution_id</strong> (optional)
                                </Form.Text>
                            </Form.Group>

                            {bulkPreview.length > 0 && (
                                <div className="mt-3">
                                    <h5>Preview ({bulkPreview.length} users)</h5>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table size="sm" striped bordered>
                                            <thead>
                                                <tr>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Inst. ID</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulkPreview.slice(0, 10).map((row, i) => (
                                                    <tr key={i}>
                                                        <td>{row.email}</td>
                                                        <td>{row.role || 'STUDENT'}</td>
                                                        <td>{row.institution_id || '-'}</td>
                                                    </tr>
                                                ))}
                                                {bulkPreview.length > 10 && (
                                                    <tr>
                                                        <td colSpan="3" className="text-center text-muted">
                                                            ...and {bulkPreview.length - 10} more
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <Alert variant="success">
                                Successfully created {bulkResults.success.length} users.
                            </Alert>
                            {bulkResults.failed.length > 0 && (
                                <Alert variant="danger">
                                    Failed to create {bulkResults.failed.length} users:
                                    <ul>
                                        {bulkResults.failed.map((fail, i) => (
                                            <li key={i}>{fail.email}: {fail.reason}</li>
                                        ))}
                                    </ul>
                                </Alert>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowBulk(false); setBulkResults(null); setBulkFile(null); setBulkPreview([]); }}>
                        Close
                    </Button>
                    {!bulkResults && (
                        <Button
                            variant="primary"
                            onClick={processBulkUpload}
                            disabled={!bulkPreview.length || bulkLoading}
                        >
                            {bulkLoading ? <Spinner size="sm" animation="border" /> : 'Upload & Create'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container >
    );
}

export default UserManagement;
