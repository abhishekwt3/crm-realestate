'use client';

import { useState } from 'react';

export default function UploadDocumentModal({ isOpen, onClose, dealId, onDocumentUploaded }) {
  const [formData, setFormData] = useState({
    title: '',
    file_url: '',
    file_type: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-populate title with filename (without extension) if title is empty
      if (!formData.title) {
        const fileNameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.');
        setFormData(prev => ({ ...prev, title: fileNameWithoutExt }));
      }
      
      // Set file type based on file extension
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      let fileType = 'document';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileExt)) {
        fileType = 'image';
      } else if (['pdf'].includes(fileExt)) {
        fileType = 'pdf';
      } else if (['doc', 'docx'].includes(fileExt)) {
        fileType = 'word';
      } else if (['xls', 'xlsx'].includes(fileExt)) {
        fileType = 'excel';
      }
      
      setFormData(prev => ({ ...prev, file_type: fileType }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Validate input
      if (!formData.title) {
        throw new Error('Document title is required');
      }

      if (!file) {
        throw new Error('Please select a file to upload');
      }

      // For this example, we'll simulate file upload
      // In a real implementation, you would upload to your server or cloud storage
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 300);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // After "upload", we get a file URL (in reality, this would come from your storage service)
      const mockFileUrl = `https://storage.example.com/documents/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      
      // Now create the document record in your backend
      const documentData = {
        title: formData.title,
        file_url: mockFileUrl,
        file_type: formData.file_type,
        deal_id: dealId
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(documentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }

      // Success
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        file_url: '',
        file_type: ''
      });
      setFile(null);
      setUploadProgress(0);

      // Call callback if provided
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
      console.error('Error uploading document:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Modal content with shadow and no background overlay */}
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upload Document</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Document uploaded successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter document title"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              File *
            </label>
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              required
              className="form-input"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: PDF, Word, Excel, Images
            </p>
          </div>
          
          {file && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Selected File:</p>
              <p className="text-sm text-gray-600">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            </div>
          )}
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-right text-xs text-gray-500 mt-1">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || !file}
              className="btn"
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}