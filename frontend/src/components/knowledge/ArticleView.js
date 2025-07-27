import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticleById } from '../../services/articleService';
import { useAuth } from '../../contexts/AuthContext';
import './KnowledgeBase.css';

const ArticleView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const data = await getArticleById(id);
                if (data.contentType !== 'typed') {
                    // Redirect to appropriate handler for non-typed articles
                    if (data.contentType === 'external') {
                        window.open(data.url, '_blank', 'noopener,noreferrer');
                    } else if (data.contentType === 'local') {
                        window.open(`http://localhost:5000${data.fileUrl}`, '_blank', 'noopener,noreferrer');
                    }
                    navigate('/knowledge');
                    return;
                }
                setArticle(data);
            } catch (err) {
                setError('Failed to load article. It may have been removed or you may not have permission to view it.');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id, navigate]);

    const handleBack = () => {
        navigate('/knowledge');
    };

    if (loading) {
        return <div className="article-view loading">Loading article...</div>;
    }

    if (error) {
        return (
            <div className="article-view error">
                <div className="error-message">{error}</div>
                <button onClick={handleBack} className="back-button">
                    Back to Knowledge Base
                </button>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="article-view not-found">
                <div className="error-message">Article not found</div>
                <button onClick={handleBack} className="back-button">
                    Back to Knowledge Base
                </button>
            </div>
        );
    }

    return (
        <div className="article-view">
            <div className="article-header">
                <button onClick={handleBack} className="back-button">
                    ← Back
                </button>
                <span className="category-badge">{article.category}</span>
                <span className="read-time">{article.readTime}</span>
            </div>
            
            <h1 className="article-title">{article.title}</h1>
            
            <div className="article-meta">
                <p>Added by: {article.addedBy?.username || 'Unknown'}</p>
                <p>Date: {new Date(article.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div className="article-summary">
                <h3>Summary</h3>
                <p>{article.summary}</p>
            </div>
            
            <div className="article-content">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>
        </div>
    );
};

export default ArticleView; 