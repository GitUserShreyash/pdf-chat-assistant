const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8001/api';
  }
  // Dynamically replace frontend with backend in the hostname for Render deployments
  return `https://${hostname.replace('frontend', 'backend')}/api`;
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private getHeaders(isMultipart = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('pdf_chat_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return {} as T;
    }
    
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // --- Auth endpoints ---
  async register(username: string, email: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    return this.handleResponse(response);
  }

  async login(username: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    const data = await this.handleResponse<any>(response);
    if (data.access_token) {
      localStorage.setItem('pdf_chat_token', data.access_token);
    }
    return data;
  }

  async getMe(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  logout(): void {
    localStorage.removeItem('pdf_chat_token');
  }

  // --- Documents endpoints ---
  async listDocuments(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    return this.handleResponse(response);
  }

  async deleteDocument(documentId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    await this.handleResponse(response);
  }

  async summarizeDocument(documentId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/summary`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // --- Chat endpoints ---
  async getChatHistory(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/chat/history`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getChatSession(chatId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${chatId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteChatSession(chatId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${chatId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    await this.handleResponse(response);
  }

  async askQuestion(question: string, documentIds: number[], chatId?: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/chat/ask`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        question,
        document_ids: documentIds,
        chat_id: chatId || null
      }),
    });
    return this.handleResponse(response);
  }
}

export const api = new ApiClient();
