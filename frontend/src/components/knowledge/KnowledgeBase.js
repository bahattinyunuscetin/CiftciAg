import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getArticles, addArticle } from "../../services/articleService";
import axios from 'axios';
import { API_BASE_URL } from "../../config";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import "./KnowledgeBase.css";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faExternalLinkAlt, faFileAlt, faNewspaper, faSearch, faUser, faEnvelope, faBriefcase, faBuilding, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';

const KnowledgeBase = () => {
    const { user } = useAuth();
    const isGuest = !user;
    const isAdminOrExpert = user && (user.role === 'admin' || user.role === 'expert');
    const isAdmin = user && user.role === 'admin';
    const [articles, setArticles] = useState([]);
    const [experts, setExperts] = useState([]);
    const [loadingExperts, setLoadingExperts] = useState(false);
    const [expertError, setExpertError] = useState("");
    const [newArticle, setNewArticle] = useState({ 
        title: "", 
        category: "", 
        summary: "", 
        readTime: "",
        contentType: "external",
        url: "",
        content: "",
        articleFile: null
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [fileSelected, setFileSelected] = useState(false);
    const [showCreateArticleForm, setShowCreateArticleForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const categories = [
        "Crop Farming",
        "Livestock",
        "Agri-Tech",
        "Market Trends",
        "Organic Farming"
    ];

    useEffect(() => {
        fetchArticles();
        fetchExperts();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const data = await getArticles();
            setArticles(data);
        } catch (err) {
            setError("Failed to load articles. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchExperts = async () => {
        try {
            setLoadingExperts(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/users/experts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setExperts(response.data);
            setExpertError("");
        } catch (err) {
            console.error("Error fetching experts:", err);
            setExpertError("Failed to load experts. Please try again later.");
        } finally {
            setLoadingExperts(false);
        }
    };

    const handleAddArticle = async (e) => {
        e.preventDefault();
        
        // Validate required fields based on content type
        if (!newArticle.title || !newArticle.category || !newArticle.summary || !newArticle.readTime) {
            setError("Title, category, summary, and read time are required.");
            return;
        }

        if (newArticle.contentType === "external" && !newArticle.url) {
            setError("URL is required for external articles.");
            return;
        }

        if (newArticle.contentType === "typed" && !newArticle.content) {
            setError("Content is required for typed articles.");
            return;
        }

        if (newArticle.contentType === "local" && !newArticle.articleFile) {
            setError("File is required for local articles.");
            return;
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append("title", newArticle.title);
            formData.append("category", newArticle.category);
            formData.append("summary", newArticle.summary);
            formData.append("readTime", newArticle.readTime);
            formData.append("contentType", newArticle.contentType);
            
            if (newArticle.contentType === "external") {
                formData.append("url", newArticle.url);
            } else if (newArticle.contentType === "typed") {
                formData.append("content", newArticle.content);
            } else if (newArticle.contentType === "local") {
                formData.append("articleFile", newArticle.articleFile);
            }

            await addArticle(formData);
            fetchArticles();
            resetForm();
            setError("");
        } catch (err) {
            setError(err.message || "Failed to add article. Please try again.");
        }
    };

    const resetForm = () => {
        setNewArticle({ 
            title: "", 
            category: "", 
            summary: "", 
            readTime: "",
            contentType: "external",
            url: "",
            content: "",
            articleFile: null
        });
        setFileSelected(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            // Validate file type (PDF, DOC, DOCX)
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            
            if (!validTypes.includes(file.type)) {
                setError("Only PDF and Word documents are allowed");
                return;
            }
            
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError("File size should not exceed 10MB");
                return;
            }
            
            setNewArticle({ ...newArticle, articleFile: file });
            setFileSelected(true);
            setError("");
        }
    };

    const handleContentTypeChange = (e) => {
        setNewArticle({ 
            ...newArticle, 
            contentType: e.target.value,
            // Reset content fields when changing type
            url: e.target.value === "external" ? newArticle.url : "",
            content: e.target.value === "typed" ? newArticle.content : "",
            articleFile: e.target.value === "local" ? newArticle.articleFile : null
        });
        
        if (e.target.value !== "local") {
            setFileSelected(false);
        }
    };

    const handleReadMore = (article) => {
        if (article.contentType === "external") {
            // Open external URL in new tab
            window.open(article.url, '_blank', 'noopener,noreferrer');
        } else if (article.contentType === "local") {
            // Open file in new tab
            window.open(`http://localhost:5000${article.fileUrl}`, '_blank', 'noopener,noreferrer');
        } else if (article.contentType === "typed") {
            // Navigate to article view
            window.location.href = `/articles/${article._id}`;
        }
    };

    const handleDeleteExpert = async (expertId) => {
        if (!window.confirm("Are you sure you want to remove this expert?")) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/users/experts/${expertId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchExperts(); // Refresh the list
        } catch (err) {
            console.error("Error deleting expert:", err);
            setExpertError("Failed to delete expert. Please try again.");
        }
    };

    return (
        <div className="knowledge-base">
            <h1>Knowledge Base</h1>
            
            {isGuest && (
                <div className="guest-access-notice">
                    <div className="guest-access-message">
                        <h3>Guest Access Available</h3>
                        <p>You can browse our knowledge base as a guest. <Link to="/login">Login</Link> or <Link to="/register">Register</Link> for full access to contribute articles and save your favorites.</p>
                    </div>
                </div>
            )}
            
            {/* Show limited features for guest users */}
            <div className="knowledge-actions">
                <div className="search-bar">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input 
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            className="clear-search"
                            onClick={() => setSearchTerm('')}
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>
                
                {isAdminOrExpert && (
                    <button 
                        className="create-article-btn"
                        onClick={() => setShowCreateArticleForm(true)}
                    >
                        Create New Article
                    </button>
                )}
            </div>
            
            {/* If there's a form for creating/submitting articles, disable it for guests and farmers */}
            {showCreateArticleForm && isAdminOrExpert && (
                <div className="create-article-form">
                    <h2>Add New Article</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleAddArticle}>
                        <div className="form-group">
                            <label>Title*</label>
                            <input
                                type="text"
                                value={newArticle.title}
                                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                                placeholder="Article title"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Category*</label>
                            <select
                                value={newArticle.category}
                                onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Summary*</label>
                            <textarea
                                value={newArticle.summary}
                                onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                                placeholder="Brief summary of the article"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Read Time*</label>
                            <input
                                type="text"
                                value={newArticle.readTime}
                                onChange={(e) => setNewArticle({ ...newArticle, readTime: e.target.value })}
                                placeholder="e.g., 5 min read"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Content Type*</label>
                            <div className="content-type-options">
                                <label>
                                    <input
                                        type="radio"
                                        name="contentType"
                                        value="external"
                                        checked={newArticle.contentType === "external"}
                                        onChange={handleContentTypeChange}
                                    />
                                    External URL
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="contentType"
                                        value="typed"
                                        checked={newArticle.contentType === "typed"}
                                        onChange={handleContentTypeChange}
                                    />
                                    Write Content
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="contentType"
                                        value="local"
                                        checked={newArticle.contentType === "local"}
                                        onChange={handleContentTypeChange}
                                    />
                                    Upload File
                                </label>
                            </div>
                        </div>
                        
                        {/* Content fields based on selected type */}
                        {newArticle.contentType === "external" && (
                            <div className="form-group">
                                <label>Article URL*</label>
                                <input
                                    type="url"
                                    value={newArticle.url}
                                    onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
                                    placeholder="https://example.com/article"
                                    required
                                />
                            </div>
                        )}
                        
                        {newArticle.contentType === "typed" && (
                            <div className="form-group">
                                <label>Article Content*</label>
                                <ReactQuill 
                                    theme="snow"
                                    value={newArticle.content}
                                    onChange={(content) => setNewArticle({ ...newArticle, content: content })}
                                    placeholder="Write your article content here..."
                                />
                            </div>
                        )}
                        
                        {newArticle.contentType === "local" && (
                            <div className="form-group">
                                <label>Upload Document* (PDF, DOC, DOCX)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                    required
                                />
                                {fileSelected && <p className="file-selected">File selected: {newArticle.articleFile.name}</p>}
                            </div>
                        )}
                        
                        <button type="submit" className="submit-btn">
                            Add Article
                        </button>
                    </form>
                </div>
            )}
            
            {/* Articles List */}
            <div className="articles-list">
                <h3 className="section-title">Available Articles</h3>
                
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading articles...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="no-articles">
                        <div className="no-articles-icon">📚</div>
                        <p>No articles available yet.</p>
                    </div>
                ) : (
                    <div className="articles-grid">
                        {articles.map((article) => (
                            <div key={article._id} className="article-card">
                                <div className="article-header">
                                    <span className="category-badge">{article.category}</span>
                                    <div className="article-indicators">
                                        <span className="read-time">
                                            <FontAwesomeIcon icon={faClock} /> {article.readTime}
                                        </span>
                                        <span className={`content-type-badge ${article.contentType}`}>
                                            {article.contentType === "external" ? (
                                                <>
                                                    <FontAwesomeIcon icon={faExternalLinkAlt} /> External Link
                                                </>
                                            ) : article.contentType === "local" ? (
                                                <>
                                                    <FontAwesomeIcon icon={faFileAlt} /> {article.fileType?.toUpperCase() || "File"}
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faNewspaper} /> Article
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="article-body">
                                    <h4 className="article-title">{article.title}</h4>
                                    <p className="summary">{article.summary}</p>
                                </div>
                                <div className="article-footer">
                                    <button 
                                        onClick={() => handleReadMore(article)}
                                        className="read-more-btn"
                                    >
                                        {article.contentType === "external" ? "Visit Article →" :
                                         article.contentType === "local" ? "Open Document →" :
                                         "Read Article →"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Meet Our Experts Section */}
            <div className="experts-section">
                <h3 className="section-title">Meet Our Experts</h3>
                
                {loadingExperts ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading experts...</p>
                    </div>
                ) : expertError ? (
                    <div className="error-message">{expertError}</div>
                ) : experts.length === 0 ? (
                    <div className="no-experts">
                        <p>No experts available at the moment.</p>
                    </div>
                ) : (
                    <div className="experts-grid">
                        {experts.map((expert) => (
                            <div key={expert._id} className="expert-card">
                                <div className="expert-avatar">
                                    <div className="avatar-placeholder">
                                        <FontAwesomeIcon icon={faUser} size="2x" />
                                    </div>
                                </div>
                                <div className="expert-info">
                                    <h4 className="expert-name">{expert.username}</h4>
                                    <div className="expert-details">
                                        <p className="expert-detail">
                                            <FontAwesomeIcon icon={faEnvelope} /> {expert.email}
                                        </p>
                                        <p className="expert-detail">
                                            <FontAwesomeIcon icon={faBriefcase} /> {expert.profile?.designation || 'Expert'}
                                        </p>
                                        <p className="expert-detail">
                                            <FontAwesomeIcon icon={faBuilding} /> {expert.profile?.company || 'Independent'}
                                        </p>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="expert-actions">
                                        <button 
                                            className="expert-action-btn delete" 
                                            onClick={() => handleDeleteExpert(expert._id)}
                                            title="Remove expert"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Add a guest message at the bottom for engagement */}
            {isGuest && (
                <div className="knowledge-cta">
                    <h3>Join our community!</h3>
                    <p>Register to contribute your own farming knowledge and access premium content.</p>
                    <Link to="/register" className="register-cta-btn">Create an Account</Link>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBase;