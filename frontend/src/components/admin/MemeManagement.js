import React, { useState, useEffect } from 'react';

const MemeManagement = () => {
    const [memes, setMemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [userFilter, setUserFilter] = useState('');

    useEffect(() => {
        fetchMemes();
    }, [page, search, userFilter]);

    const fetchMemes = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });
            if (search) {
                params.append('search', search);
            }
            if (userFilter) {
                params.append('user_id', userFilter);
            }
            
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl}/api/admin/memes?${params}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to load memes');
            }
            const data = await res.json();
            setMemes(data.memes);
            setTotalPages(data.pages);
        } catch (err) {
            setError('Failed to load memes');
            console.error('Error fetching memes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMeme = async (memeId) => {
        if (!window.confirm('Are you sure you want to delete this meme? This action cannot be undone.')) {
            return;
        }

        try {
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl}/api/admin/memes/${memeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete meme');
            }
            fetchMemes();
        } catch (err) {
            alert('Failed to delete meme: ' + err.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getMemeImageUrl = (filePath) => {
        if (!filePath) return null;
        const filename = filePath.split('/').pop();
        return `/generated/${filename}`;
    };

    if (loading) {
        return <div className="loading">Loading memes...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="meme-management">
            <h2>🖼️ Meme Management</h2>
            
            {/* Removed create meme section as requested */}

            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search memes by topic..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
                <input
                    type="text"
                    placeholder="Filter by user ID..."
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="search-input"
                />
                <button 
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                        setSearch('');
                        setUserFilter('');
                    }}
                >
                    Clear
                </button>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Preview</th>
                        <th>Topic</th>
                        <th>Template</th>
                        <th>User</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {memes.map(meme => (
                        <tr key={meme._id}>
                            <td>
                                {getMemeImageUrl(meme.file_path) && (
                                    <img 
                                        src={getMemeImageUrl(meme.file_path)} 
                                        alt={meme.topic}
                                        style={{ 
                                            width: '60px', 
                                            height: '60px', 
                                            objectFit: 'cover',
                                            borderRadius: '5px'
                                        }}
                                    />
                                )}
                            </td>
                            <td>{meme.topic}</td>
                            <td>{meme.template}</td>
                            <td>{meme.username}</td>
                            <td>{formatDate(meme.created_at)}</td>
                            <td>
                                <button
                                    className="admin-btn admin-btn-danger"
                                    onClick={() => handleDeleteMeme(meme._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {memes.length === 0 && (
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    No memes found
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
        </div>
    );
};

export default MemeManagement;
