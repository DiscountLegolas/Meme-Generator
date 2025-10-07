import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com',
  timeout: 90000, // 30 seconds timeout
});

// Request interceptor for adding auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token to all requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Utility function to add path prefix to image fields
const addImagePathPrefix = (data, prefix = 'https://www.meme-generator-backend.com') => {
  if (!data || typeof data !== 'object') return data;
  
  const processValue = (value) => {
    if (typeof value === 'string') {
      // Check if the string ends with .jpg, .jpeg, or .png (case insensitive)
      const imageExtensions = /\.(jpg|jpeg|png)$/i;
      if (imageExtensions.test(value)) {
        // Only add prefix if it doesn't already start with a path or http
        return `${prefix}/${value}`
      }
    } else if (Array.isArray(value)) {
      return value.map(processValue);
    } else if (value && typeof value === 'object') {
      return addImagePathPrefix(value, prefix);
    }
    return value;
  };

  if (Array.isArray(data)) {
    return data.map(processValue);
  }

  const processed = {};
  for (const [key, value] of Object.entries(data)) {
    processed[key] = processValue(value);
  }
  
  return processed;
};

// Response interceptor for handling errors and processing image paths
api.interceptors.response.use(
  (response) => {
    // Process response data to add path prefix to image fields
    if (response.data) {
      response.data = addImagePathPrefix(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.error || 'An error occurred');
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      console.error('Error:', error.message);
      throw new Error('An unexpected error occurred.');
    }
  }
);

// API functions
export const fetchTemplates = async () => {
  try {
    console.log(localStorage.getItem('meme-generator-language'))
    if (localStorage.getItem('meme-generator-language')=="tr-TR"){
      const responsetr = await api.get('/api/templatestr');
      return responsetr.data;
    }
    const response = await api.get('/api/templatesfront');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    // Return fallback templates if API fails
    return {
      "drake_hotline": {
        name: "Drake Hotline",
        file: "/Memes/Drake.png",
        description: "Perfect for comparing two choices",
        tags: ["comparison", "choice", "preference", "better", "worse", "decision", "opinion", "taste", "style"]
      },
      "uno_card": {
        name: "Uno Card",
        file: "/Memes/UnoCart.png",
        description: "Great for refusal scenarios",
        tags: ["refusal", "rejection", "no", "denial", "refuse", "angry", "frustrated", "mad", "upset", "disappointed"]
      },
      "two_buttons": {
        name: "Two Buttons",
        file: "/Memes/TwoButtons.png",
        description: "Ideal for dilemmas and choices",
        tags: ["dilemma", "choice", "decision", "confused", "difficult", "hard", "problem", "trouble", "stress", "anxiety"]
      },
      "batman_slap": {
        name: "Batman Slap",
        file: "/Memes/BatmanSlap.png",
        description: "Perfect for rejection humor",
        tags: ["rejection", "slap", "angry", "mad", "furious", "disappointed", "hurt", "pain", "shock", "surprise"]
      },
      "distracted_bf": {
        name: "Distracted Bf",
        file: "/Memes/Boyfriend.png",
        description: "Great for distraction scenarios",
        tags: ["distraction", "attention", "focus", "love", "relationship", "jealous", "attractive", "beautiful", "pretty", "hot"]
      },
      "road_division": {
        name: "Road Division",
        file: "/Memes/Road.png",
        description: "Perfect for path choices",
        tags: ["path", "choice", "decision", "direction", "future", "life", "career", "success", "failure", "journey"]
      }
    };
  }
};

export const generateMeme = async (topic, templateKey) => {
  try {
    const requestData = { topic };
    
    // Only add template to request if one is selected
    if (templateKey) {
      requestData.template = templateKey;
    }
    requestData.lang=localStorage.getItem('meme-generator-language')
    console.log(requestData)
    const response = await api.post('/api/generate-meme', requestData);
    const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
    if (response.data.success) {
      return {
        imageUrl:`${baseUrl}/generated/${response.data.meme_path.split('/').pop()}`,
        topic: response.data.topic,
        template: response.data.template,
      };
    } else {
      throw new Error(response.data.error || 'Failed to generate meme');
    }
  } catch (error) {
    console.error('Failed to generate meme:', error);
    throw error;
  }
};

export const generateFromUserTemplate = async (topic, templateId) => {
  try {
    const response = await api.post('/api/generate-from-user-template', {
      topic,
      template_id: templateId,
      lang:localStorage.getItem('meme-generator-language')
    });
    const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';

    if (response.data.success) {
      return {
        imageUrl: `${baseUrl}/generated/${response.data.meme_path.split('/').pop()}`,
        topic: response.data.topic,
        template: response.data.template,
        lang:localStorage.getItem('meme-generator-language')
      };
    } else {
      throw new Error(response.data.error || 'Failed to generate meme');
    }
  } catch (error) {
    console.error('Failed to generate from user template:', error);
    throw error;
  }
};

export const generateShitpost = async (topic, style = 'random') => {
  try {
    const response = await api.post('/api/generate-shitpost', {
      topic,
      style,
      lang: localStorage.getItem('meme-generator-language') || 'en'
    });
    
    const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
    
    if (response.data.success) {
      return {
        imageUrl: `${baseUrl}/generated/${response.data.meme_path.split('/').pop()}`,
        topic: response.data.topic,
        template: response.data.template,
        style: response.data.style
      };
    } else {
      throw new Error(response.data.error || 'Failed to generate shitpost');
    }
  } catch (error) {
    console.error('Failed to generate shitpost:', error);
    throw error;
  }
};

export const searchTemplates = async (query) => {
  try {
    const response = await api.post('/api/search-templates', { query });
    if (response.data.success) {
      return response.data.templates;
    } else {
      throw new Error(response.data.error || 'Failed to search templates');
    }
  } catch (error) {
    console.error('Failed to search templates:', error);
    throw error;
  }
};

export const healthCheck = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Template to Meme API
export const uploadImageAndGenerateMeme = async (formData) => {
  try {
    const response = await api.post('/api/generate-template-to-meme', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
    if (response.data.success) {
      return {
        imageUrl: `${baseUrl}/generated/${response.data.meme_path.split('/').pop()}`,
        topic: formData.get('topic'),
        message: response.data.message
      };
    } else {
      throw new Error(response.data.error || 'Failed to generate meme from image');
    }
  } catch (error) {
    console.error('Failed to upload image and generate meme:', error);
    throw error;
  }
};

// My Templates API
export const getMyTemplates = async () => {
  try {
    const response = await api.get('/api/my-templates');
    console.log(response.data)
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to fetch templates');
    }
  } catch (error) {
    console.error('Failed to fetch my templates:', error);
    throw error;
  }
};

export const updateTemplate = async (templateId, templateData) => {
  try {
    const payload = {
      ...templateData,
      template_id: templateId, // add template_id in the body
    };
    const response = await api.put(`/api/update-template`, payload);
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to update template');
    }
  } catch (error) {
    console.error('Failed to update template:', error);
    throw error;
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    const response = await api.delete(`/api/my-templates/${templateId}`);
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to delete template');
    }
  } catch (error) {
    console.error('Failed to delete template:', error);
    throw error;
  }
};

// Profile API
export const getProfile = async () => {
  try {
    const response = await api.get('/api/profile');
    if (response.data.success) {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
      const memes = (response.data.memes || []).map((m) => {
        const filename = (m.imageUrl || '').split('/').pop();
        return {
          ...m,
          imageUrl: filename ? `${baseUrl}/generated/${filename}` : m.imageUrl,
        };
      });
      return {
        profile: response.data.profile,
        memes,
      };
    } else {
      throw new Error(response.data.error || 'Failed to fetch profile');
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/api/profile', profileData);
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

export const bulkDeleteMemes = async (memeIds) => {
  try {
    const response = await api.post(`/api/memes/bulk-delete`, { meme_ids: memeIds });
    if (response.data.success) return response.data;
    throw new Error(response.data.error || 'Failed to bulk delete memes');
  } catch (error) {
    console.error('Failed to bulk delete memes:', error);
    throw error;
  }
};

export const apiService = api;
export default api;

// Face detection API
export const detectFaces = async (templateIdentifier) => {
  const response = await api.post(
    '/api/detect_faces',
    { template: templateIdentifier }, // <-- JSON body
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (response.data.success) {
    return response.data.faces || [];
  }
  throw new Error(response.data.error || 'Failed to detect faces');
};

// Face swap API
export const swapFaces = async (templateIdentifier, sourceFiles, indices) => {
  const form = new FormData();
  form.append('template', templateIdentifier);
  if (Array.isArray(sourceFiles)) {
    sourceFiles.forEach((file) => form.append('sources', file));
  }
  if (Array.isArray(indices) && indices.length > 0) {
    form.append('indices', JSON.stringify(indices));
  }
  console.log("send request")
  const response = await api.post('/api/swap_faces', form, {
    responseType: 'blob',
  });
  // Create an object URL to preview/download
  const blob = response.request.response;
  console.log(blob)
  const url = window.URL.createObjectURL(blob);
  console.log(url)
  return url;
};

// Save swapped image as a new user template
export const saveSwappedAsTemplate = async (
  originalTemplateIdentifier,
  imageBlob,
  { name, description, captionPoints }
) => {
  const form = new FormData();
  const filename = `${(name || 'template').replace(/\s+/g, '_').toLowerCase()}.png`;
  form.append('image', imageBlob, filename);
  if (name) form.append('name', name);
  if (description) form.append('description', description);
  // backend requires a topic; reuse convention from upload flow
  form.append('topic', 'Template upload');
  if (Array.isArray(captionPoints) && captionPoints.length > 0) {
    form.append('captionPoints', JSON.stringify(captionPoints));
  }
  // include original template identifier for traceability (backend may ignore)
  form.append('original_template', originalTemplateIdentifier);

  const response = await api.post('/api/template-to-meme', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
export const fetchLatestRedditMemes = async () => {
  try {
    const response = await api.get('/api/reddit/latest');
    const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';

    if (response.data.status === 'ok' && Array.isArray(response.data.results)) {
      // Map over the results and construct the full image URL
      return response.data.results.map(meme => ({
        ...meme,
        imageUrl: `${baseUrl}/generated/${meme.meme_path.split('/').pop()}`
      }));
    } else {
      // If the response format is not as expected
      throw new Error('Invalid data format received from the server');
    }
  } catch (error) {
    console.error('Failed to fetch latest Reddit memes:', error);
    // Re-throw the error so the component can handle it
    throw error;
  }
};
export const chat = async (topic) => {
  try {
    console.log(topic)
    const response = await api.post('/api/chatbot/chat', {
      topic,
      lang: localStorage.getItem('meme-generator-language') || 'en'
    });
    
    const baseUrl = process.env.REACT_APP_API_URL || 'https://www.meme-generator-backend.com';
    
    if (response.data.success) {
      return {
        chat: response.data.chat_response,
        topic: response.data.topic,
        template: response.data.template
      };
    } else {
      throw new Error(response.data.error || 'Failed to generate shitpost');
    }
  } catch (error) {
    console.error('Failed to generate shitpost:', error);
    throw error;
  }
};