// Установка текущего года в подвале
document.addEventListener('DOMContentLoaded', function() {
  const currentYearElements = document.querySelectorAll('#current-year');
  const currentYear = new Date().getFullYear();
  
  currentYearElements.forEach(el => {
    el.textContent = currentYear;
  });

  // Инициализируем страницу в зависимости от её типа
  const path = window.location.pathname;
  
  if (path.includes('category.html')) {
    initCategoryPage();
  } else if (path === '/' || path.includes('index.html')) {
    initHomePage();
  }
});

// Функция для получения параметров из URL
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Форматирование размера файла
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Форматирование даты
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}

// Инициализация главной страницы
function initHomePage() {
  // Загрузка категорий
  fetch('/api/categories')
    .then(response => response.json())
    .then(categories => {
      const categoryGrid = document.querySelector('.category-grid');
      
      if (categories.length === 0) {
        // Нет категорий
        categoryGrid.innerHTML = `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
            <h3>Нет доступных категорий</h3>
            <p>Администратор еще не создал категории файлов</p>
          </div>
        `;
      } else {
        // Отображаем категории
        categoryGrid.innerHTML = categories.map(category => `
          <div class="category-card">
            <div class="category-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </div>
            <h3>${category.name}</h3>
            <p>${category.description || ''}</p>
            <div class="file-count">${category.fileCount} файлов</div>
            <a href="category.html?id=${category.id}" class="button">Просмотреть</a>
          </div>
        `).join('');
      }
    })
    .catch(error => {
      console.error('Ошибка загрузки категорий:', error);
    });
}

// Инициализация страницы категории
function initCategoryPage() {
  const categoryId = getUrlParameter('id');
  
  if (!categoryId) {
    window.location.href = 'index.html';
    return;
  }
  
  // Загрузка данных категории
  fetch(`/api/categories/${categoryId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Категория не найдена');
      }
      return response.json();
    })
    .then(category => {
      // Установка заголовка категории
      document.getElementById('category-title').textContent = category.name;
      
      const filesContainer = document.getElementById('files-container');
      const searchInput = document.getElementById('search-input');
      
      // Функция для фильтрации и отображения файлов
      function renderFiles(searchTerm = '') {
        if (!category.files || category.files.length === 0) {
          // Нет файлов
          filesContainer.innerHTML = `
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
              <h3>${searchTerm ? 'Файлы не найдены' : 'В этой категории пока нет файлов'}</h3>
              <p>${searchTerm ? 'Попробуйте изменить поисковый запрос или выбрать другую категорию' : 'Администратор еще не добавил файлы в эту категорию'}</p>
            </div>
          `;
          return;
        }
        
        // Фильтрация файлов по поисковому запросу
        const filteredFiles = category.files.filter(file => 
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        if (filteredFiles.length === 0) {
          // Нет результатов поиска
          filesContainer.innerHTML = `
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
              <h3>Файлы не найдены</h3>
              <p>Попробуйте изменить поисковый запрос или выбрать другую категорию</p>
            </div>
          `;
        } else {
          // Отображение файлов
          filesContainer.innerHTML = filteredFiles.map(file => `
            <div class="file-item">
              <div class="file-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <div>
                  <div class="file-name">${file.name}</div>
                  ${file.description ? `<div class="file-description">${file.description}</div>` : ''}
                </div>
              </div>
              <div class="file-type">
                ${file.type}
              </div>
              <div class="file-size">
                ${formatFileSize(file.size)}
              </div>
              <div class="file-date">
                ${formatDate(file.createdAt)}
              </div>
              <div>
                <a href="/api/download/${file.id}" class="button" data-file-id="${file.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon" style="margin-right: 0.25rem;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Скачать
                </a>
              </div>
            </div>
          `).join('');
        }
      }
      
      // Отображение файлов при загрузке страницы
      renderFiles();
      
      // Обработчик поискового ввода
      searchInput.addEventListener('input', function() {
        renderFiles(this.value);
      });
    })
    .catch(error => {
      console.error('Ошибка загрузки категории:', error);
      document.querySelector('main .container').innerHTML = `
        <div class="error-state">
          <h2>Ошибка загрузки категории</h2>
          <p>Категория не найдена или произошла ошибка при загрузке данных.</p>
          <a href="index.html" class="button">Вернуться на главную</a>
        </div>
      `;
    });
}