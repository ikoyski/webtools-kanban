const BASE_URL = 'https://api.ikoyski.top/kanban-backend';

class ApiClient {
  static async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
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

  static async moveCard(id, sourceColumnId, targetColumnId, newIndex) {
    return this.request(`/v1/cards/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({
        sourceColumnId,
        targetColumnId,
        newIndex,
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
