import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserGuide.css';

const UserGuide = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [newSection, setNewSection] = useState({ title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/userguide');
      if (!response.ok) throw new Error('Failed to fetch sections');
      const data = await response.json();
      setSections(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section) => {
    setEditingSection({ ...section });
  };

  const handleSave = async (sectionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/userguide/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingSection)
      });

      if (!response.ok) throw new Error('Failed to update section');
      
      const updatedSection = await response.json();
      setSections(sections.map(section => 
        section._id === sectionId ? updatedSection : section
      ));
      setEditingSection(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/userguide/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete section');
      
      setSections(sections.filter(section => section._id !== sectionId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async () => {
    if (!newSection.title.trim() || !newSection.content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/userguide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSection)
      });

      if (!response.ok) throw new Error('Failed to create section');
      
      const createdSection = await response.json();
      setSections([...sections, createdSection]);
      setNewSection({ title: '', content: '' });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="user-guide">
      <div className="loading">Loading...</div>
    </div>
  );

  return (
    <div className="user-guide">
      <h1>User Guide</h1>
      
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search sections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Error Message */}
      {error && <div className="error">{error}</div>}

      {/* Admin Controls */}
      {user?.role === 'admin' && (
        <div className="admin-controls">
          <h2>Create New Section</h2>
          <div className="create-section">
            <input
              type="text"
              placeholder="Section Title"
              value={newSection.title}
              onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
            />
            <textarea
              placeholder="Section Content"
              value={newSection.content}
              onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
            />
            <button onClick={handleCreate}>Create Section</button>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="sections">
        {filteredSections.length === 0 ? (
          <div className="no-sections">No sections found</div>
        ) : (
          filteredSections.map((section) => (
            <div key={section._id} className="section">
              {editingSection?._id === section._id ? (
                <div className="edit-section">
                  <input
                    type="text"
                    value={editingSection.title}
                    onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  />
                  <textarea
                    value={editingSection.content}
                    onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                  />
                  <div className="edit-buttons">
                    <button onClick={() => handleSave(section._id)}>Save</button>
                    <button onClick={() => setEditingSection(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2>{section.title}</h2>
                  <p>{section.content}</p>
                  {user?.role === 'admin' && (
                    <div className="section-actions">
                      <button onClick={() => handleEdit(section)}>Edit</button>
                      <button onClick={() => handleDelete(section._id)}>Delete</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserGuide; 