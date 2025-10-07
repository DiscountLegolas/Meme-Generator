import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const AdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl}/api/admin/stats`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError('Failed to load statistics');
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading statistics...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!stats) {
        return <div className="error">No statistics available</div>;
    }

    return (
        <div className="admin-stats">
            <h2>📊 Dashboard Statistics</h2>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>{stats.total_users}</h3>
                    <p>Total Users</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.total_memes}</h3>
                    <p>Total Memes</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.new_users_24h}</h3>
                    <p>New Users (24h)</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.new_memes_24h}</h3>
                    <p>New Memes (24h)</p>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-card">
                    <h3>👥 Top Users by Meme Count</h3>
                    {stats.top_users && stats.top_users.length > 0 ? (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Meme Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.top_users.map((user, index) => (
                                    <tr key={user._id}>
                                        <td>#{index + 1}</td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.meme_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No user data available</p>
                    )}
                </div>

                <div className="chart-card">
                    <h3>🎨 Most Popular Templates</h3>
                    {stats.top_templates && stats.top_templates.length > 0 ? (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Template</th>
                                    <th>Usage Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.top_templates.map((template, index) => (
                                    <tr key={template._id}>
                                        <td>#{index + 1}</td>
                                        <td>{template._id}</td>
                                        <td>{template.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No template data available</p>
                    )}
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                    className="admin-btn admin-btn-primary"
                    onClick={fetchStats}
                >
                    🔄 Refresh Statistics
                </button>
            </div>
        </div>
    );
};

export default AdminStats;
