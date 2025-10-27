// Глобальные переменные
let allData = null;
let isAuthenticated = false;

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initEventListeners();
});

// Проверка авторизации
function checkAuth() {
  const auth = localStorage.getItem('adminAuth');
  if (auth === 'true') {
    isAuthenticated = true;
    showAdminPanel();
    loadAdminData();
  } else {
    showLoginForm();
  }
}

// Показ формы авторизации
function showLoginForm() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
}

// Показ админ-панели
function showAdminPanel() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
}

// Инициализация обработчиков событий
function initEventListeners() {
  // Форма авторизации
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
  });

  // Форма добавления фильма
  document.getElementById('addFilmForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleAddFilm();
  });

  // Форма добавления зала
  document.getElementById('addHallForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleAddHall();
  });
}

// Обработка авторизации
async function handleLogin() {
  const login = document.getElementById('loginInput').value;
  const password = document.getElementById('passwordInput').value;
  const errorDiv = document.getElementById('loginError');

  try {
    await api.login(login, password);
    
    localStorage.setItem('adminAuth', 'true');
    isAuthenticated = true;
    showAdminPanel();
    loadAdminData();
    
    errorDiv.style.display = 'none';
  } catch (error) {
    errorDiv.textContent = 'Неверный логин или пароль';
    errorDiv.style.display = 'block';
  }
}

// Загрузка данных для админ-панели
async function loadAdminData() {
  try {
    allData = await api.getAllData();
    renderFilms();
    renderHalls();
    renderSchedule();
  } catch (error) {
    alert('Ошибка загрузки данных: ' + error.message);
  }
}

// Рендер фильмов
function renderFilms() {
  const filmsList = document.getElementById('filmsList');
  const { films } = allData;

  if (films.length === 0) {
    filmsList.innerHTML = '<div class="col-12"><p class="text-muted">Фильмы не добавлены</p></div>';
    return;
  }

  let html = '';
  films.forEach(film => {
    html += `
      <div class="col-md-4 mb-3">
        <div class="card">
          <img src="${film.film_poster}" class="card-img-top" alt="${film.film_name}" style="height: 300px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${film.film_name}</h5>
            <p class="card-text">
              <small class="text-muted">${film.film_duration} мин. | ${film.film_origin}</small>
            </p>
            <button class="btn btn-danger btn-sm" onclick="deleteFilm(${film.id})">
              Удалить
            </button>
          </div>
        </div>
      </div>
    `;
  });

  filmsList.innerHTML = html;
}

// Рендер залов
function renderHalls() {
  const hallsList = document.getElementById('hallsList');
  const { halls } = allData;

  if (halls.length === 0) {
    hallsList.innerHTML = '<p class="text-muted">Залы не добавлены</p>';
    return;
  }

  let html = '';
  halls.forEach(hall => {
    html += `
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="card-title mb-1">${hall.hall_name}</h5>
              <p class="card-text text-muted mb-0">
                Рядов: ${hall.hall_rows}, Мест в ряду: ${hall.hall_places} | 
                Обычные: ${hall.hall_price_standart}₽, VIP: ${hall.hall_price_vip}₽
              </p>
            </div>
            <div class="btn-group">
              <button class="btn btn-primary btn-sm" onclick="editHall(${hall.id})">
                Редактировать
              </button>
              <button class="btn btn-success btn-sm" onclick="toggleHallOpen(${hall.id})">
                ${hall.hall_open === 1 ? 'Приостановить продажу' : 'Открыть продажу'}
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteHall(${hall.id})">
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  hallsList.innerHTML = html;
}

// Удаление фильма
async function deleteFilm(filmId) {
  if (!confirm('Вы уверены, что хотите удалить этот фильм?')) {
    return;
  }

  try {
    await api.deleteFilm(filmId);
    await loadAdminData();
  } catch (error) {
    alert('Ошибка при удалении фильма: ' + error.message);
  }
}

// Удаление зала
async function deleteHall(hallId) {
  if (!confirm('Вы уверены, что хотите удалить этот зал? Все связанные сеансы будут удалены.')) {
    return;
  }

  try {
    await api.deleteHall(hallId);
    await loadAdminData();
  } catch (error) {
    alert('Ошибка при удалении зала: ' + error.message);
  }
}

// Переключение состояния продажи билетов
async function toggleHallOpen(hallId) {
  try {
    const hall = allData.halls.find(h => h.id === hallId);
    const newStatus = hall.hall_open === 1 ? 0 : 1;
    
    await api.toggleHallOpen(hallId, newStatus);
    await loadAdminData();
  } catch (error) {
    alert('Ошибка при изменении статуса зала: ' + error.message);
  }
}

// Добавление фильма
async function handleAddFilm() {
  const form = document.getElementById('addFilmForm');
  const formData = new FormData(form);

  try {
    await api.addFilm(
      formData.get('filmName'),
      formData.get('filmDuration'),
      formData.get('filmOrigin'),
      formData.get('filmPoster')
    );

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('addFilmModal'));
    modal.hide();
    form.reset();

    await loadAdminData();
  } catch (error) {
    alert('Ошибка при добавлении фильма: ' + error.message);
  }
}

// Добавление зала
async function handleAddHall() {
  const form = document.getElementById('addHallForm');
  const formData = new FormData(form);

  try {
    await api.addHall(formData.get('hallName'));

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('addHallModal'));
    modal.hide();
    form.reset();

    await loadAdminData();
  } catch (error) {
    alert('Ошибка при добавлении зала: ' + error.message);
  }
}

// Редактирование зала
function editHall(hallId) {
  const hall = allData.halls.find(h => h.id === hallId);
  if (!hall) return;

  // Открываем модальное окно редактирования зала
  alert('Функция редактирования зала будет реализована. Для изменения схемы зала нужно будет добавить модальное окно.');
  // TODO: Реализовать модальное окно для редактирования зала
}

// Рендер расписания (упрощенная версия без drag & drop)
function renderSchedule() {
  const scheduleTimeline = document.getElementById('scheduleTimeline');
  const { halls, films, seances } = allData;

  let html = '<p class="text-muted">Функция управления расписанием будет реализована позже.</p>';
  scheduleTimeline.innerHTML = html;
}

// Сделаем функции глобальными
window.deleteFilm = deleteFilm;
window.deleteHall = deleteHall;
window.toggleHallOpen = toggleHallOpen;
window.editHall = editHall;
