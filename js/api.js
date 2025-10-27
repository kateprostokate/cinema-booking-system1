/**
 * Класс для работы с Backend API
 */
class API {
  constructor(baseURL = 'https://shfe-diplom.neto-server.ru') {
    this.baseURL = baseURL;
  }

  /**
   * Базовый метод для выполнения запросов
   */
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Произошла ошибка');
      }

      return data.result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Получение всех данных (залы, фильмы, сеансы)
   */
  async getAllData() {
    return this.request('/alldata');
  }

  /**
   * Авторизация
   */
  async login(login, password) {
    const formData = new FormData();
    formData.append('login', login);
    formData.append('password', password);

    return this.request('/login', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Добавление нового кинозала
   */
  async addHall(hallName) {
    const formData = new FormData();
    formData.append('hallName', hallName);

    return this.request('/hall', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Удаление кинозала
   */
  async deleteHall(hallId) {
    return this.request(`/hall/${hallId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Изменение конфигурации посадочных мест в кинозале
   */
  async updateHallConfig(hallId, hallConfig) {
    const formData = new FormData();
    formData.append('hallId', hallId);
    formData.append('hallConfig', JSON.stringify(hallConfig));

    return this.request('/hallConfig', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Изменение стоимости билетов в кинозале
   */
  async updateHallPrice(hallId, hallPriceStandard, hallPriceVip) {
    const formData = new FormData();
    formData.append('hallId', hallId);
    formData.append('hallPriceStandart', hallPriceStandard);
    formData.append('hallPriceVip', hallPriceVip);

    return this.request('/hallPrice', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Открытие/закрытие продажи билетов в кинозале
   */
  async toggleHallOpen(hallId, hallOpen) {
    const formData = new FormData();
    formData.append('hallId', hallId);
    formData.append('hallOpen', hallOpen);

    return this.request('/hallOpen', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Добавление нового фильма
   */
  async addFilm(filmName, filmDuration, filmOrigin, filmPoster) {
    const formData = new FormData();
    formData.append('filmName', filmName);
    formData.append('filmDuration', filmDuration);
    formData.append('filmOrigin', filmOrigin);
    formData.append('filmPoster', filmPoster);

    return this.request('/film', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Удаление фильма
   */
  async deleteFilm(filmId) {
    return this.request(`/film/${filmId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Добавление нового сеанса
   */
  async addSeance(seanceFilmId, seanceHallId, seanceTime) {
    const formData = new FormData();
    formData.append('seanceFilmId', seanceFilmId);
    formData.append('seanceHallId', seanceHallId);
    formData.append('seanceTime', seanceTime);

    return this.request('/seance', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Удаление сеанса
   */
  async deleteSeance(seanceId) {
    return this.request(`/seance/${seanceId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Получение актуальной схемы зала на выбранный сеанс
   */
  async getHallConfig(seanceId, seanceDate) {
    const params = new URLSearchParams({
      seanceId: seanceId,
      seanceDate: seanceDate,
    });

    return this.request(`/hallConfig?${params}`);
  }

  /**
   * Покупка билетов
   */
  async buyTickets(seanceId, ticketDate, tickets) {
    const formData = new FormData();
    formData.append('seanceId', seanceId);
    formData.append('ticketDate', ticketDate);
    formData.append('tickets', JSON.stringify(tickets));

    return this.request('/ticket', {
      method: 'POST',
      body: formData,
    });
  }
}

// Создаем экземпляр API
const api = new API();
