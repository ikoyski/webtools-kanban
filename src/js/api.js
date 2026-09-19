const BASE_URL = '/kanban-backend';

class ApiClient {
  static async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem('kanban-token');
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }

      if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
              if (errorText) {
                  const errorData = JSON.parse(errorText);
                  errorMessage = errorData.message || errorMessage;
              }
          } catch (e) {
              // Fallback if error body isn't JSON
          }
          throw new Error(errorMessage);
      }

      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : null;

    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  static async login(email, password) {
    return this.request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async signup(email, password, displayName) {
    return this.request('/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  static async getBoard() {
    return this.request('/v1/board');
  }

  static async createColumn(title, boardId) {
    return this.request('/v1/columns', {
      method: 'POST',
      body: JSON.stringify({
        title,
        boardId
      }),
    });
  }

  static async renameColumn(id, title) {
    return this.request(`/v1/columns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  static async deleteColumn(id) {
    return this.request(`/v1/columns/${id}`, {
      method: 'DELETE',
    });
  }

  static async createCard(columnId, cardData) {
    return this.request('/v1/cards', {
      method: 'POST',
      body: JSON.stringify({ ...cardData, columnId }),
    });
  }

  static async updateCard(id, cardData) {
    return this.request(`/v1/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(cardData),
    });
  }

  static async deleteCard(id) {
    return this.request(`/v1/cards/${id}`, {
      method: 'DELETE',
    });
  }

  static async moveCard(cardId, columnId, position) {
    return this.request(`/v1/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({
        columnId,
        position
      }),
    });
  }

  static async exportBoard() {
    return this.request('/v1/board/export');
  }

  static async importBoard(boardData) {
    return this.request('/v1/board/import', {
      method: 'PUT',
      body: JSON.stringify(boardData),
    });
  }
}

export default ApiClient;
