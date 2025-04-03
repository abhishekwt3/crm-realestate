const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    // Get token from localStorage instead of cookies
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create organization');
    }
    
    // Redirect to organizations list
    router.push('/organizations');
  } catch (err) {
    setError(err.message);
    console.error('Error creating organization:', err);
  } finally {
    setLoading(false);
  }
};