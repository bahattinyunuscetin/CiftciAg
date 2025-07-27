import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserGuide.css';

const UserGuide = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDocument, setNewDocument] = useState({ title: '', description: '', document: null });
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/userguide');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDocument({ ...newDocument, document: file });
    }
  };

  const handleCreate = async () => {
    if (!newDocument.title.trim() || !newDocument.document) {
      setError('Please provide a title and upload a document');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newDocument.title);
      formData.append('description', newDocument.description);
      formData.append('document', newDocument.document);

      const response = await fetch('http://localhost:5000/api/userguide', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to create document');
      
      const createdDocument = await response.json();
      setDocuments([...documents, createdDocument]);
      setNewDocument({ title: '', description: '', document: null });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/userguide/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete document');
      
      setDocuments(documents.filter(doc => doc._id !== documentId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await fetch(`http://localhost:5000/api/userguide/${documentId}/document`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to download document');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="user-guide">
      <h1>User Guide</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error">{error}</div>}

      {user?.role === 'admin' && (
        <div className="admin-controls">
          <h2>Upload New Document</h2>
          <div className="create-document">
            <input
              type="text"
              placeholder="Document Title"
              value={newDocument.title}
              onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
            />
            <textarea
              placeholder="Document Description"
              value={newDocument.description}
              onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
            />
            <div className="file-upload">
              <label htmlFor="document-upload">Upload Document (PDF, DOC, etc.)</label>
              <input
                id="document-upload"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
              />
              {newDocument.document && (
                <span className="file-name">{newDocument.document.name}</span>
              )}
            </div>
            <button onClick={handleCreate}>Upload Document</button>
          </div>
        </div>
      )}

      <div className="documents">
        {filteredDocuments.length === 0 ? (
          <div className="no-documents">No documents found</div>
        ) : (
          filteredDocuments.map((doc) => (
            <div key={doc._id} className="document">
              <h2>{doc.title}</h2>
              <p>{doc.description}</p>
              <div className="document-preview">
                <button 
                  onClick={() => handleDownload(doc._id, doc.document.filename)}
                  className="download-button"
                >
                  Download {doc.document.filename}
                </button>
              </div>
              {user?.role === 'admin' && (
                <div className="document-actions">
                  <button onClick={() => handleDelete(doc._id)}>Delete</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserGuide; 