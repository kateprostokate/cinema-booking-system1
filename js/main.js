// Глобальные переменные
let scheduleData = null;
let selectedDate = 'today';
let allData = null;

// Инициализация страницы расписания
document.addEventListener('DOMContentLoaded', async () => {
  // Проверяем, на какой странице мы находимся
  if (document.getElementById('schedule')) {
    // Это главная страница
    await loadSchedule();
    initDateButtons();
  }
});

// Загрузка расписания
async function loadSchedule() {
  try {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('schedule').style.display = 'none';

    allData = await api.getAllData();
    scheduleData = allData;
    
    renderSchedule();

    document.getElementById('loading').style.display = 'none';
    document.getElementById('schedule').style.display = 'block';
  } catch (error) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = 'Ошибка загрузки данных: ' + error.message;
  }
}

// Инициализация кнопок выбора даты
function initDateButtons() {
  document.getElementById('todayBtn').addEventListener('click', () => {
    selectedDate = 'today';
    renderSchedule();
  });

  document.getElementById('tomorrowBtn').addEventListener('click', () => {
    selectedDate = 'tomorrow';
    renderSchedule();
  });
}

// Рендер расписания
function renderSchedule() {
  if (!scheduleData) return;

  const scheduleContainer = document.getElementById('schedule');
  const { halls, films, seances } = scheduleData;

  // Определяем текущую дату
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const currentDate = selectedDate === 'today' ? today : tomorrow;
  const dateStr = currentDate.toISOString().split('T')[0];

  // Получаем текущее время в HH:MM формате
  const currentTime = today.toTimeString().slice(0, 5);

  // Фильтруем открытые залы
  const openHalls = halls.filter(hall => hall.hall_open === 1);

  // Группируем сеансы по залам
  const scheduleByHall = {};

  openHalls.forEach(hall => {
    const hallSeances = seances
      .filter(seance => seance.seance_hallid === hall.id)
      .map(seance => {
        const film = films.find(f => f.id === seance.seance_filmid);
        return { ...seance, film };
      })
      .filter(seance => seance.film);

    if (hallSeances.length > 0) {
      scheduleByHall[hall.id] = {
        hall,
        seances: hallSeances
      };
    }
  });

  // Рендерим карточки залов с сеансами
  let html = '';

  if (Object.keys(scheduleByHall).length === 0) {
    html = '<div class="alert alert-info">На выбранную дату нет доступных сеансов</div>';
  } else {
    Object.values(scheduleByHall).forEach(({ hall, seances }) => {
      const seancesHtml = seances
        .map(seance => {
          // Проверяем, не прошел ли сеанс (только для сегодня)
          const isPast = selectedDate === 'today' && seance.seance_time < currentTime;
          
          return `
            <div class="schedule__seance ${isPast ? 'schedule__seance--past' : ''}" 
                 data-seance="${seance.id}" 
                 data-film="${seance.film.id}"
                 data-time="${seance.seance_time}">
              <a href="client.html?seance=${seance.id}&date=${dateStr}" 
                 class="btn btn-outline-primary ${isPast ? 'disabled' : ''}"
                 ${isPast ? 'tabindex="-1" aria-disabled="true"' : ''}>
                ${seance.seance_time}
              </a>
            </div>
          `;
        })
        .join('');

      html += `
        <div class="schedule__hall card mb-4">
          <div class="card-header">
            <h4>${hall.hall_name}</h4>
          </div>
          <div class="card-body">
            <div class="schedule__seances">
              ${seancesHtml}
            </div>
          </div>
        </div>
      `;
    });
  }

  scheduleContainer.innerHTML = html;
}

// Инициализация выбора мест
window.initSeatSelection = async function(seanceId, date) {
  // Загружаем все данные
  allData = await api.getAllData();
  const { halls, films, seances } = allData;
  
  const seance = seances.find(s => s.id == seanceId);
  const hall = halls.find(h => h.id == seance.seance_hallid);
  const film = films.find(f => f.id == seance.seance_filmid);

  if (!hall || !film) {
    alert('Ошибка: не найдены данные о сеансе');
    window.location.href = 'index.html';
    return;
  }

  // Обновляем заголовки
  document.getElementById('filmTitle').textContent = film.film_name;
  document.getElementById('sessionInfo').textContent = 
    `${film.film_name} | ${hall.hall_name} | ${date} | ${seance.seance_time}`;

  // Получаем актуальную конфигурацию зала
  let hallConfig;
  try {
    const configData = await api.getHallConfig(seanceId, date);
    hallConfig = configData.hallConfig;
  } catch (error) {
    // Если не удалось получить конфигурацию, используем базовую
    alert('Используется базовая конфигурация зала');
    hallConfig = Array(hall.hall_rows).fill(null).map(() => 
      Array(hall.hall_places).fill('standart')
    );
  }

  // Отображаем схему зала
  renderHallScheme(hall, hallConfig, seance, film);

  // Инициализируем обработчик бронирования
  const buyBtn = document.getElementById('buyBtn');
  buyBtn.addEventListener('click', () => {
    buyTickets(seanceId, date, hall);
  });
};

// Рендер схемы зала
function renderHallScheme(hall, hallConfig, seance, film) {
  const hallSchemeDiv = document.getElementById('hallScheme');
  let html = '';

  // Экран
  html += '<div class="hall-screen mb-4">Экран</div>';

  // Места
  html += '<div class="hall-seats">';
  for (let row = 0; row < hall.hall_rows; row++) {
    html += `<div class="hall-row mb-2">`;
    html += `<span class="row-number">${row + 1}</span>`;
    
    for (let place = 0; place < hall.hall_places; place++) {
      const seatType = hallConfig[row][place];
      const seatClass = getSeatClass(seatType);
      
      html += `
        <div class="seat ${seatClass}" 
             data-row="${row + 1}" 
             data-place="${place + 1}"
             data-type="${seatType}">
          ${place + 1}
        </div>
      `;
    }
    
    html += `</div>`;
  }
  html += '</div>';

  hallSchemeDiv.innerHTML = html;

  // Обработчики кликов на места
  document.querySelectorAll('.seat').forEach(seat => {
    seat.addEventListener('click', () => {
      const seatType = seat.dataset.type;
      
      // Можно кликать только на свободные места
      if (seatType === 'standart' || seatType === 'vip') {
        toggleSeatSelection(seat, hall);
      }
    });
  });
}

// Получение CSS класса для места
function getSeatClass(seatType) {
  const classes = {
    'standart': 'seat--available',
    'vip': 'seat--available seat--vip',
    'taken': 'seat--taken',
    'disabled': 'seat--disabled'
  };
  return classes[seatType] || 'seat--disabled';
}

// Переключение выбора места
function toggleSeatSelection(seat, hall) {
  seat.classList.toggle('seat--selected');
  updateSelectedSeats(hall);
}

// Обновление списка выбранных мест
function updateSelectedSeats(hall) {
  const selectedSeats = document.querySelectorAll('.seat--selected');
  const selectedSeatsDiv = document.getElementById('selectedSeats');
  const totalPriceSpan = document.getElementById('totalPrice');
  const buyBtn = document.getElementById('buyBtn');

  if (selectedSeats.length === 0) {
    selectedSeatsDiv.innerHTML = '<p class="text-muted">Места не выбраны</p>';
    totalPriceSpan.textContent = '0';
    buyBtn.disabled = true;
    return;
  }

  let html = '';
  let total = 0;

  selectedSeats.forEach(seat => {
    const row = seat.dataset.row;
    const place = seat.dataset.place;
    const isVip = seat.classList.contains('seat--vip');
    const price = isVip ? hall.hall_price_vip : hall.hall_price_standart;
    
    total += price;
    
    html += `
      <div class="d-flex justify-content-between mb-2">
        <span>Ряд ${row}, Место ${place} ${isVip ? '(VIP)' : ''}</span>
        <strong>${price} руб.</strong>
      </div>
    `;
  });

  selectedSeatsDiv.innerHTML = html;
  totalPriceSpan.textContent = total;
  buyBtn.disabled = false;
}

// Покупка билетов
async function buyTickets(seanceId, date, hall) {
  const selectedSeats = document.querySelectorAll('.seat--selected');
  
  if (selectedSeats.length === 0) {
    alert('Выберите места для бронирования');
    return;
  }

  const tickets = Array.from(selectedSeats).map(seat => {
    const row = parseInt(seat.dataset.row);
    const place = parseInt(seat.dataset.place);
    const isVip = seat.classList.contains('seat--vip');
    const cost = isVip ? hall.hall_price_vip : hall.hall_price_standart;

    return { row, place, coast: cost };
  });

  try {
    buyBtn.disabled = true;
    buyBtn.textContent = 'Обработка...';

    const result = await api.buyTickets(seanceId, date, tickets);
    
    // Сохраняем данные о билетах и перенаправляем на страницу с билетом
    localStorage.setItem('tickets', JSON.stringify(result.tickets));
    window.location.href = `ticket.html`;
    
  } catch (error) {
    alert('Ошибка при бронировании: ' + error.message);
    buyBtn.disabled = false;
    buyBtn.textContent = 'Забронировать';
  }
}
