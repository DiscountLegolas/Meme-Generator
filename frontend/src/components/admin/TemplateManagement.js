import React, { useState, useEffect } from 'react';

const TemplateManagement = () => {
    const [templates, setTemplates] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [createForm, setCreateForm] = useState({ key: '', name: '', file: '', fileFile: null, tags: '', explanation: '', examples: [], exampleInput: '' });
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const formatExample = (example) => {
        if (example === null || example === undefined) return '';
        if (typeof example === 'string') return example;
        if (typeof example === 'object') {
            // Collect caption fields like caption1, caption2, caption3, ... in numeric order
            const captionEntries = Object.entries(example)
                .filter(([key, value]) => /^caption\d+$/i.test(key) && value)
                .map(([key, value]) => ({
                    index: parseInt(key.replace(/[^\d]/g, ''), 10),
                    value: String(value).trim()
                }))
                .filter(entry => !Number.isNaN(entry.index) && entry.value);
            if (captionEntries.length > 0) {
                captionEntries.sort((a, b) => a.index - b.index);
                return captionEntries.map(e => e.value).join(' | ');
            }
            try {
                return JSON.stringify(example);
            } catch (e) {
                return String(example);
            }
        }
        return String(example);
    };

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
            const token = localStorage.getItem('token');
            console.log(token)
            const res = await fetch(`${baseUrl}/api/admin/templates`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to load templates');
            }
            const data = await res.json();
            setTemplates(data);
        } catch (err) {
            setError('Failed to load templates');
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditTemplate = (templateKey, template) => {
        setSelectedTemplate({ key: templateKey, ...template });
        setEditForm({
            name: template.name,
            tags: template.tags ? template.tags.join(', ') : '',
            explanation: template.explanation || '',
            examples: Array.isArray(template.examples) ? template.examples : [],
            exampleInput: ''
        });
        setShowEditModal(true);
    };

    const handleUpdateTemplate = async () => {
        try {
            const updateData = {
                name: editForm.name,
                tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                explanation: editForm.explanation,
                examples: (editForm.examples || []).slice(0, 10)
            };
            
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl}/api/admin/templates/${selectedTemplate.key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(updateData)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update template');
            }
            setShowEditModal(false);
            setSelectedTemplate(null);
            fetchTemplates();
        } catch (err) {
            alert('Failed to update template: ' + (err.response?.data?.error || err.message));
        }
    };

    const getTemplateImageUrl = (filePath) => {
        const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
        if (!filePath) return null;
        const filename = filePath.split('/').pop();
        return `${baseUrl}/Memes/${filename}`;
    };

    if (loading) {
        return <div className="loading">Loading templates...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="template-management">
            <h2>🎨 Template Management</h2>
            
            <div className="create-section" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Create Template</h3>
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
                        let uploadedPath = '';
                        if (createForm.fileFile) {
                            const formData = new FormData();
                            formData.append('file', createForm.fileFile);
                            const uploadRes = await fetch(`${baseUrl}/api/admin/templates/upload`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': token ? `Bearer ${token}` : ''
                                },
                                body: formData
                            });
                            if (!uploadRes.ok) {
                                const err = await uploadRes.json().catch(() => ({}));
                                throw new Error(err.error || 'Failed to upload image');
                            }
                            const uploadData = await uploadRes.json();
                            uploadedPath = uploadData.file || '';
                        }
                        const payload = {
                            key: createForm.key,
                            name: createForm.name,
                            file: uploadedPath || createForm.file,
                            explanation: createForm.explanation,
                            tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                            examples: (createForm.examples || []).slice(0, 10)
                        };
                        const res = await fetch(`${baseUrl}/api/admin/templates`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token ? `Bearer ${token}` : ''
                            },
                            body: JSON.stringify(payload)
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || 'Failed to create template');
                        }
                        setCreateForm({ key: '', name: '', file: '', fileFile: null, tags: '', explanation: '', examples: [], exampleInput: '' });
                        fetchTemplates();
                    } catch (err) {
                        alert('Failed to create template: ' + err.message);
                    }
                }} className="modal-form">
                    <div className="form-group">
                        <label>Key</label>
                        <input type="text" value={createForm.key} onChange={(e) => setCreateForm({ ...createForm, key: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Template image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                                setCreateForm({ ...createForm, fileFile: file, file: '' });
                            }}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Tags (comma-separated)</label>
                        <input type="text" value={createForm.tags} onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={createForm.explanation} onChange={(e) => setCreateForm({ ...createForm, explanation: e.target.value })} rows="2" />
                    </div>
                    <div className="form-group">
                        <label>Examples (max 10)</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                                type="text"
                                value={createForm.exampleInput}
                                onChange={(e) => setCreateForm({ ...createForm, exampleInput: e.target.value })}
                                placeholder="Add example"
                                disabled={(createForm.examples || []).length >= 10}
                            />
                            <button
                                type="button"
                                className="admin-btn admin-btn-success"
                                onClick={() => {
                                    const raw = (createForm.exampleInput || '').trim();
                                    if (!raw) return;
                                    if ((createForm.examples || []).length >= 10) return;
                                    let valueToPush = raw;
                                    if (raw.includes(',')) {
                                        const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
                                        if (parts.length > 0) {
                                            const obj = {};
                                            parts.forEach((p, idx) => {
                                                obj[`caption${idx + 1}`] = p;
                                            });
                                            valueToPush = obj;
                                        }
                                    }
                                    setCreateForm({
                                        ...createForm,
                                        examples: [...(createForm.examples || []), valueToPush],
                                        exampleInput: ''
                                    });
                                }}
                                disabled={(createForm.examples || []).length >= 10}
                            >
                                Add
                            </button>
                        </div>
                        {(createForm.examples || []).length > 0 && (
                            <ul style={{ listStyle: 'disc', paddingLeft: '18px' }}>
                                {(createForm.examples || []).map((ex, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <span>{formatExample(ex)}</span>
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn-danger"
                                            onClick={() => {
                                                const next = (createForm.examples || []).filter((_, i) => i !== idx);
                                                setCreateForm({ ...createForm, examples: next });
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {(createForm.examples || []).length}/10 examples
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="admin-btn admin-btn-success">Create</button>
                    </div>
                </form>
                )}
            </div>

            <div className="templates-grid">
                {Object.entries(templates).map(([key, template]) => (
                    <div key={key} className="template-card">
                        <div className="template-image">
                            {getTemplateImageUrl(template.file) && (
                                <img 
                                    src={getTemplateImageUrl(template.file)} 
                                    alt={template.name}
                                />
                            )}
                        </div>
                        <div className="template-info">
                            <h3>{template.name}</h3>
                            <p><strong>Key:</strong> {key}</p>
                            <p><strong>Tags:</strong> {template.tags ? template.tags.join(', ') : 'None'}</p>
                            {template.explanation && (
                                <p><strong>Description:</strong> {template.explanation}</p>
                            )}
                            {Array.isArray(template.examples) && template.examples.length > 0 && (
                                <div>
                                    <p><strong>Examples:</strong></p>
                                    <ul style={{ listStyle: 'disc', paddingLeft: '18px', marginTop: '4px' }}>
                                        {template.examples.slice(0, 10).map((ex, idx) => (
                                            <li key={idx}>{formatExample(ex)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="template-actions">
                                <button
                                    className="admin-btn admin-btn-warning"
                                    onClick={() => handleEditTemplate(key, template)}
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {Object.keys(templates).length === 0 && (
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    No templates found
                </p>
            )}

            {/* Edit Template Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Edit Template</h2>
                        <form className="modal-form" onSubmit={e => { e.preventDefault(); handleUpdateTemplate(); }}>
                            <div className="form-group">
                                <label>Template Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={editForm.tags}
                                    onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                                    placeholder="funny, viral, trending"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={editForm.explanation}
                                    onChange={(e) => setEditForm({...editForm, explanation: e.target.value})}
                                    rows="3"
                                    placeholder="Template description..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Examples (max 10)</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input
                                        type="text"
                                        value={editForm.exampleInput || ''}
                                        onChange={(e) => setEditForm({ ...editForm, exampleInput: e.target.value })}
                                        placeholder="Add example"
                                        disabled={(editForm.examples || []).length >= 10}
                                    />
                                    <button
                                        type="button"
                                        className="admin-btn admin-btn-success"
                                        onClick={() => {
                                            const raw = (editForm.exampleInput || '').trim();
                                            if (!raw) return;
                                            if ((editForm.examples || []).length >= 10) return;
                                            let valueToPush = raw;
                                            if (raw.includes(',')) {
                                                const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
                                                if (parts.length > 0) {
                                                    const obj = {};
                                                    parts.forEach((p, idx) => {
                                                        obj[`caption${idx + 1}`] = p;
                                                    });
                                                    valueToPush = obj;
                                                }
                                            }
                                            setEditForm({
                                                ...editForm,
                                                examples: [...(editForm.examples || []), valueToPush],
                                                exampleInput: ''
                                            });
                                        }}
                                        disabled={(editForm.examples || []).length >= 10}
                                    >
                                        Add
                                    </button>
                                </div>
                                {(editForm.examples || []).length > 0 && (
                                    <ul style={{ listStyle: 'disc', paddingLeft: '18px' }}>
                                        {(editForm.examples || []).map((ex, idx) => (
                                            <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <span>{formatExample(ex)}</span>
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn-danger"
                                                    onClick={() => {
                                                        const next = (editForm.examples || []).filter((_, i) => i !== idx);
                                                        setEditForm({ ...editForm, examples: next });
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    {(editForm.examples || []).length}/10 examples
                                </div>
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
                                    Update Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateManagement;
