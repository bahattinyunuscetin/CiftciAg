import axios from 'axios';

const API_URL = 'http://localhost:5000/api/articles'; // Add full URL for clarity

// Get all articles
export const getArticles = async (category = null, contentType = null) => {
  try {
    let url = API_URL;
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (contentType) params.append('contentType', contentType);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching articles:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch articles');
  }
};

// Get article by ID
export const getArticleById = async (articleId) => {
  try {
    const response = await axios.get(`${API_URL}/${articleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching article:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch article');
  }
};

// Add new article (supports multipart/form-data for file uploads)
export const addArticle = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(API_URL, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for multipart/form-data, axios will do it
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error adding article:', error.response?.data);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      'Failed to add article'
    );
  }
};

// Delete article
export const deleteArticle = async (articleId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.delete(`${API_URL}/${articleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error deleting article:', error.response?.data);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      'Failed to delete article'
    );
  }
};