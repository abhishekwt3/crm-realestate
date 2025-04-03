const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    
    // Add token to request if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      ...options,
      headers,
    };
    
    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Unauthorized - Session expired');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API request error: ${endpoint}`, error);
      throw error;
    }
  }
  
  // Auth endpoints - Login/Register handled directly in AuthProvider
  
  async getCurrentUser() {
    return this.request('auth/me');
  }
  
  // Organizations
  async getOrganizations() {
    return this.request('organizations');
  }
  
  async createOrganization(data) {
    return this.request('organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  // Team members
  async getTeamMembers() {
    return this.request('team');
  }
  
  async createTeamMember(data) {
    return this.request('team', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  // Notes
  async getDealNotes(dealId) {
    return this.request(`deals/${dealId}/notes`);
  }
  
  async createDealNote(dealId, data) {
    return this.request(`deals/${dealId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  // Meetings
  async getDealMeetings(dealId) {
    return this.request(`deals/${dealId}/meetings`);
  }
  
  async createDealMeeting(dealId, data) {
    return this.request(`deals/${dealId}/meetings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

   // Contacts methods
   async getContacts(params = {}) {
    return this.request('contacts', { params });
  }

  async createContact(contactData) {
    return this.request('contacts', {
      method: 'POST',
      body: contactData
    });
  }

  async getContactById(id) {
    return this.request(`contacts/${id}`);
  }

  async updateContact(id, contactData) {
    return this.request(`contacts/${id}`, {
      method: 'PUT',
      body: contactData
    });
  }

  async deleteContact(id) {
    return this.request(`contacts/${id}`, {
      method: 'DELETE'
    });
  }

    // Properties methods
    async getProperties(params = {}) {
        return this.request('properties', { params });
      }
    
      async createProperty(propertyData) {
        return this.request('properties', {
          method: 'POST',
          body: propertyData
        });
      }
    
      async getPropertyById(id) {
        return this.request(`properties/${id}`);
      }
    
      async updateProperty(id, propertyData) {
        return this.request(`properties/${id}`, {
          method: 'PUT',
          body: propertyData
        });
      }
    
      async deleteProperty(id) {
        return this.request(`properties/${id}`, {
          method: 'DELETE'
        });
      }

}



export default new ApiClient();