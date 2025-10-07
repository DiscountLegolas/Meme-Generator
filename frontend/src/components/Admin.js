import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import UserManagement from './admin/UserManagement';
import MemeManagement from './admin/MemeManagement';
import TemplateManagement from './admin/TemplateManagement';
import AdminStats from './admin/AdminStats';
import './Admin.css';

const Admin = () => {
    const { user } = useAuth();
    const { t, tWithParams } = useLocalization();
    const [activeTab, setActiveTab] = useState('stats');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is admin
        if (user && user.role === 'admin') {
            setIsAdmin(true);
        }
        setLoading(false);
    }, [user]);

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading">{t('admin.loading')}</div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="admin-container">
                <div className="access-denied">
                    <h2>{t('admin.accessDenied')}</h2>
                    <p>{t('admin.noPermission')}</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'stats', label: t('admin.dashboard'), icon: '📊' },
        { id: 'users', label: t('admin.users'), icon: '👥' },
        { id: 'memes', label: t('admin.memes'), icon: '🖼️' },
        { id: 'templates', label: t('admin.templates'), icon: '🎨' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'stats':
                return <AdminStats />;
            case 'users':
                return <UserManagement />;
            case 'memes':
                return <MemeManagement />;
            case 'templates':
                return <TemplateManagement />;
            default:
                return <AdminStats />;
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>🛠️ {t('admin.title')}</h1>
                <p>{tWithParams('admin.welcomeBack', { username: user?.username })}</p>
            </div>

            <div className="admin-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="admin-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default Admin;
