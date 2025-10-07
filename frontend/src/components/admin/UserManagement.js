import React, { useState, useEffect } from 'react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'user' });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });
            if (search) {
                params.append('search', search);
            }
            
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl}/api/admin/users?${params}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to load users');
            }
            const data = await res.json();
            setUsers(data.users);
            setTotalPages(data.pages);
        } catch (err) {
            setError('Failed to load users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditForm({
            username: user.username,
            email: user.email,
            role: user.role || 'user',
            meme_count: user.meme_count || 0
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async () => {
        try {
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl}/api/admin/users/${selectedUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(editForm)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update user');
            }
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            alert('Failed to update user: ' + err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete user');
            }
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user: ' + err.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return <div className="loading">Loading users...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="user-management">
            <h2>👥 User Management</h2>
            
            <div className="create-section" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Create User</h3>
                    <button
                        type="button"
                        className="admin-btn"
                        onClick={() => setShowCreate(!showCreate)}
                    >
                        {showCreate ? 'Hide' : 'Show'}
                    </button>
                </div>
                {showCreate && (
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${baseUrl}/api/admin/users`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token ? `Bearer ${token}` : ''
                            },
                            body: JSON.stringify(createForm)
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || 'Failed to create user');
                        }
                        setCreateForm({ username: '', email: '', password: '', role: 'user' });
                        fetchUsers();
                    } catch (err) {
                        alert('Failed to create user: ' + err.message);
                    }
                }} className="modal-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={createForm.username}
                            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select
                            value={createForm.role}
                            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="admin-btn admin-btn-success">Create</button>
                    </div>
                </form>
                )}
            </div>

            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
                <button 
                    className="admin-btn admin-btn-primary"
                    onClick={() => setSearch('')}
                >
                    Clear
                </button>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Meme Count</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>
                                <span className={`role-badge ${user.role || 'user'}`}>
                                    {user.role || 'user'}
                                </span>
                            </td>
                            <td>{user.meme_count || 0}</td>
                            <td>{formatDate(user.created_at)}</td>
                            <td>
                                <button
                                    className="admin-btn admin-btn-warning"
                                    onClick={() => handleEditUser(user)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="admin-btn admin-btn-danger"
                                    onClick={() => handleDeleteUser(user._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {users.length === 0 && (
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    No users found
                </p>
            )}

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={page === pageNum ? 'active' : ''}
                        >
                            {pageNum}
                        </button>
                    ))}
                    
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Edit User</h2>
                        <form className="modal-form" onSubmit={e => { e.preventDefault(); handleUpdateUser(); }}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Meme Count</label>
                                <input
                                    type="number"
                                    value={editForm.meme_count}
                                    onChange={(e) => setEditForm({...editForm, meme_count: parseInt(e.target.value)})}
                                    min="0"
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="admin-btn"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="admin-btn admin-btn-success"
                                >
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
