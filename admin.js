// Инициализация страницы по её типу
document.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname;
  
  if (path.includes('admin-login.html')) {
    initAdminLogin();
  } else if (path.includes('admin-dashboard.html')) {
    initAdminDashboard();
  }
});

// Вспомогательные функции
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}

// Проверка авторизации
function checkAuth() {
  return fetch('/api/me')
    .then(response => {
      if (!response.ok) {
        throw new Error('Не авторизован');
      }
      return response.json();
    })
    .then(user => {
      if (!user.isAdmin) {
        throw new Error('Доступ запрещен');
      }
      return user;
    });
}

// Инициализация страницы входа для админа
function initAdminLogin() {
  const loginForm = document.getElementById('admin-login-form');
  const loginButton = document.getElementById('login-button');
  const loginError = document.getElementById('login-error');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');
  
  // Проверим, авторизован ли пользователь
  fetch('/api/me')
    .then(response => response.json())
    .then(user => {
      if (user && user.isAdmin) {
        // Уже авторизован и админ, перенаправляем
        window.location.href = 'admin-dashboard.html';
      }
    })
    .catch(() => {
      // Не авторизован, оставляем на странице входа
    });
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Сбрасываем ошибки
    loginError.textContent = '';
    usernameError.textContent = '';
    passwordError.textContent = '';
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Валидация
    let hasErrors = false;
    
    if (username.length < 3) {
      usernameError.textContent = 'Имя пользователя должно быть не менее 3 символов';
      hasErrors = true;
    }
    
    if (password.length < 6) {
      passwordError.textContent = 'Пароль должен быть не менее 6 символов';
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    // Показываем состояние загрузки
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="loading-spinner"></span> Вход...';
    
    // Отправляем запрос на авторизацию
    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Неверное имя пользователя или пароль');
      }
      return response.json();
    })
    .then(user => {
      if (user.isAdmin) {
        window.location.href = 'admin-dashboard.html';
      } else {
        loginError.textContent = 'У вас нет прав администратора';
      }
    })
    .catch(error => {
      loginError.textContent = error.message;
      loginButton.disabled = false;
      loginButton.textContent = 'Войти';
    });
  });
}

// Инициализация панели администратора
function initAdminDashboard() {
  // Проверка авторизации
  checkAuth()
    .then(() => {
      // Переключение вкладок
      setupTabs();
      
      // Загрузка данных для каждой вкладки
      loadCategories();
      loadFiles();
      loadStats();
      
      // Настройка модальных окон
      setupModals();
      
      // Настройка кнопки выхода
      document.getElementById('logout-button').addEventListener('click', logout);
    })
    .catch(() => {
      // Перенаправление на страницу входа
      window.location.href = 'admin-login.html';
    });
}

// Настройка переключения вкладок
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Деактивируем все вкладки
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Активируем выбранную вкладку
      button.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
}

// Загрузка категорий
function loadCategories() {
  const categoriesList = document.getElementById('categories-list');
  
  fetch('/api/categories')
    .then(response => response.json())
    .then(categories => {
      if (categories.length === 0) {
        categoriesList.innerHTML = `
          <div class="empty-state">
            <p>Категории не найдены. Создайте новую категорию.</p>
          </div>
        `;
      } else {
        categoriesList.innerHTML = categories.map(category => `
          <div class="category-item" data-id="${category.id}">
            <div class="category-details">
              <h3>${category.name}</h3>
              <p>${category.description || ''}</p>
            </div>
            <div class="category-actions">
              <button class="action-button edit-button" data-action="edit" data-id="${category.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="action-button delete-button" data-action="delete" data-id="${category.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        `).join('');
        
        // Добавляем обработчики событий
        document.querySelectorAll('.edit-button[data-action="edit"]').forEach(button => {
          button.addEventListener('click', () => editCategory(button.getAttribute('data-id')));
        });
        
        document.querySelectorAll('.delete-button[data-action="delete"]').forEach(button => {
          button.addEventListener('click', () => confirmDeleteCategory(button.getAttribute('data-id')));
        });
      }
    })
    .catch(error => {
      console.error('Ошибка загрузки категорий:', error);
      categoriesList.innerHTML = `
        <div class="error-state">
          <p>Ошибка при загрузке категорий. Пожалуйста, повторите попытку позже.</p>
        </div>
      `;
    });
}

// Загрузка файлов
function loadFiles() {
  const filesContainer = document.getElementById('admin-files-container');
  
  fetch('/api/files')
    .then(response => response.json())
    .then(files => {
      if (files.length === 0) {
        filesContainer.innerHTML = `
          <div class="empty-state">
            <p>Файлы не найдены. Загрузите новый файл.</p>
          </div>
        `;
      } else {
        // Загружаем категории для отображения имен
        fetch('/api/categories')
          .then(response => response.json())
          .then(categories => {
            const categoryMap = {};
            categories.forEach(category => {
              categoryMap[category.id] = category.name;
            });
            
            // Отображаем файлы
            filesContainer.innerHTML = files.map(file => `
              <div class="file-item" data-id="${file.id}">
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
                <div class="file-category">
                  ${categoryMap[file.categoryId] || 'Неизвестно'}
                </div>
                <div class="file-type">
                  ${file.type}
                </div>
                <div class="file-size">
                  ${formatFileSize(file.size)}
                </div>
                <div class="file-downloads">
                  ${file.downloads}
                </div>
                <div class="file-actions">
                  <button class="action-button delete-button" data-action="delete-file" data-id="${file.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            `).join('');
            
            // Добавляем обработчики событий
            document.querySelectorAll('.action-button[data-action="delete-file"]').forEach(button => {
              button.addEventListener('click', () => confirmDeleteFile(button.getAttribute('data-id')));
            });
          });
      }
    })
    .catch(error => {
      console.error('Ошибка загрузки файлов:', error);
      filesContainer.innerHTML = `
        <div class="error-state">
          <p>Ошибка при загрузке файлов. Пожалуйста, повторите попытку позже.</p>
        </div>
      `;
    });
}

// Загрузка статистики
function loadStats() {
  fetch('/api/stats')
    .then(response => response.json())
    .then(stats => {
      // Общая статистика
      document.getElementById('total-downloads').textContent = stats.totalDownloads;
      document.getElementById('total-files').textContent = stats.totalFiles;
      document.getElementById('total-categories').textContent = stats.totalCategories;
      
      // Популярные файлы
      const popularFilesContainer = document.getElementById('popular-files');
      
      if (stats.popularFiles.length === 0) {
        popularFilesContainer.innerHTML = `
          <div class="empty-state">
            <p>Нет данных о скачиваниях</p>
          </div>
        `;
      } else {
        popularFilesContainer.innerHTML = stats.popularFiles.map(file => `
          <div class="popular-file">
            <div class="popular-file-name">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              ${file.name}
            </div>
            <div class="popular-file-downloads">
              ${file.downloads} <span class="download-label">скачиваний</span>
            </div>
          </div>
        `).join('');
      }
    })
    .catch(error => {
      console.error('Ошибка загрузки статистики:', error);
    });
}

// Настройка модальных окон
function setupModals() {
  // Кнопки открытия модалок
  document.getElementById('add-category-button').addEventListener('click', () => openCategoryModal());
  document.getElementById('add-file-button').addEventListener('click', () => openFileModal());
  
  // Кнопки закрытия модалок
  document.getElementById('close-category-modal').addEventListener('click', () => closeCategoryModal());
  document.getElementById('cancel-category').addEventListener('click', () => closeCategoryModal());
  document.getElementById('close-file-modal').addEventListener('click', () => closeFileModal());
  document.getElementById('cancel-file').addEventListener('click', () => closeFileModal());
  document.getElementById('close-confirm-modal').addEventListener('click', () => closeConfirmModal());
  document.getElementById('cancel-delete').addEventListener('click', () => closeConfirmModal());
  
  // Формы отправки
  document.getElementById('category-form').addEventListener('submit', submitCategoryForm);
  document.getElementById('file-form').addEventListener('submit', submitFileForm);
}

// Открытие модального окна категории (создание)
function openCategoryModal(categoryId = null) {
  const modal = document.getElementById('category-modal');
  const titleElement = document.getElementById('category-modal-title');
  const form = document.getElementById('category-form');
  const idInput = document.getElementById('category-id');
  const nameInput = document.getElementById('category-name');
  const descriptionInput = document.getElementById('category-description');
  
  // Сбрасываем форму
  form.reset();
  
  if (categoryId) {
    // Редактирование
    titleElement.textContent = 'Редактировать категорию';
    
    // Загружаем данные категории
    fetch(`/api/categories/${categoryId}`)
      .then(response => response.json())
      .then(category => {
        idInput.value = category.id;
        nameInput.value = category.name;
        descriptionInput.value = category.description || '';
        
        // Открываем модалку
        modal.classList.add('active');
      })
      .catch(error => {
        console.error('Ошибка загрузки категории:', error);
        alert('Не удалось загрузить данные категории');
      });
  } else {
    // Создание
    titleElement.textContent = 'Добавить категорию';
    idInput.value = '';
    
    // Открываем модалку
    modal.classList.add('active');
  }
}

// Закрытие модального окна категории
function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('active');
}

// Отправка формы категории
function submitCategoryForm(e) {
  e.preventDefault();
  
  const form = document.getElementById('category-form');
  const idInput = document.getElementById('category-id');
  const nameInput = document.getElementById('category-name');
  const descriptionInput = document.getElementById('category-description');
  
  const data = {
    name: nameInput.value,
    description: descriptionInput.value || null
  };
  
  const categoryId = idInput.value;
  let url = '/api/categories';
  let method = 'POST';
  
  if (categoryId) {
    // Редактирование
    url = `/api/categories/${categoryId}`;
    method = 'PUT';
  }
  
  fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Ошибка при сохранении категории');
    }
    return response.json();
  })
  .then(() => {
    // Закрываем модалку и обновляем список
    closeCategoryModal();
    loadCategories();
  })
  .catch(error => {
    console.error('Ошибка сохранения категории:', error);
    alert('Не удалось сохранить категорию');
  });
}

// Редактирование категории
function editCategory(categoryId) {
  openCategoryModal(categoryId);
}

// Подтверждение удаления категории
function confirmDeleteCategory(categoryId) {
  const modal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmDeleteButton = document.getElementById('confirm-delete');
  
  // Загружаем информацию о категории
  fetch(`/api/categories/${categoryId}`)
    .then(response => response.json())
    .then(category => {
      confirmMessage.textContent = `Вы уверены, что хотите удалить категорию "${category.name}"? Это действие нельзя отменить.`;
      
      // Настраиваем кнопку удаления
      confirmDeleteButton.onclick = () => deleteCategory(categoryId);
      
      // Открываем модалку
      modal.classList.add('active');
    })
    .catch(error => {
      console.error('Ошибка загрузки категории:', error);
      alert('Не удалось загрузить данные категории');
    });
}

// Удаление категории
function deleteCategory(categoryId) {
  fetch(`/api/categories/${categoryId}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Ошибка при удалении категории');
    }
    
    // Закрываем модалку и обновляем список
    closeConfirmModal();
    loadCategories();
    loadFiles(); // Обновляем файлы, т.к. категория может содержать файлы
  })
  .catch(error => {
    console.error('Ошибка удаления категории:', error);
    alert('Не удалось удалить категорию');
    closeConfirmModal();
  });
}

// Открытие модального окна файла
function openFileModal() {
  const modal = document.getElementById('file-modal');
  const categorySelect = document.getElementById('file-category');
  
  // Загружаем категории для выбора
  fetch('/api/categories')
    .then(response => response.json())
    .then(categories => {
      if (categories.length === 0) {
        alert('Сначала создайте хотя бы одну категорию');
        return;
      }
      
      // Заполняем выпадающий список
      categorySelect.innerHTML = categories.map(category => 
        `<option value="${category.id}">${category.name}</option>`
      ).join('');
      
      // Сбрасываем форму
      document.getElementById('file-form').reset();
      
      // Открываем модалку
      modal.classList.add('active');
    })
    .catch(error => {
      console.error('Ошибка загрузки категорий:', error);
      alert('Не удалось загрузить категории');
    });
}

// Закрытие модального окна файла
function closeFileModal() {
  document.getElementById('file-modal').classList.remove('active');
}

// Отправка формы файла
function submitFileForm(e) {
  e.preventDefault();
  
  const form = document.getElementById('file-form');
  const fileInput = document.getElementById('file-upload');
  
  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Пожалуйста, выберите файл');
    return;
  }
  
  const formData = new FormData(form);
  
  fetch('/api/files', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Ошибка при загрузке файла');
    }
    return response.json();
  })
  .then(() => {
    // Закрываем модалку и обновляем список
    closeFileModal();
    loadFiles();
  })
  .catch(error => {
    console.error('Ошибка загрузки файла:', error);
    alert('Не удалось загрузить файл');
  });
}

// Подтверждение удаления файла
function confirmDeleteFile(fileId) {
  const modal = document.getElementById('confirm-modal');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmDeleteButton = document.getElementById('confirm-delete');
  
  // Загружаем информацию о файле
  fetch(`/api/files/${fileId}`)
    .then(response => response.json())
    .then(file => {
      confirmMessage.textContent = `Вы уверены, что хотите удалить файл "${file.name}"? Это действие нельзя отменить.`;
      
      // Настраиваем кнопку удаления
      confirmDeleteButton.onclick = () => deleteFile(fileId);
      
      // Открываем модалку
      modal.classList.add('active');
    })
    .catch(error => {
      console.error('Ошибка загрузки файла:', error);
      alert('Не удалось загрузить данные файла');
    });
}

// Удаление файла
function deleteFile(fileId) {
  fetch(`/api/files/${fileId}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Ошибка при удалении файла');
    }
    
    // Закрываем модалку и обновляем список
    closeConfirmModal();
    loadFiles();
  })
  .catch(error => {
    console.error('Ошибка удаления файла:', error);
    alert('Не удалось удалить файл');
    closeConfirmModal();
  });
}

// Закрытие модального окна подтверждения
function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('active');
}

// Выход из аккаунта
function logout() {
  fetch('/api/logout', {
    method: 'POST'
  })
  .then(() => {
    window.location.href = 'admin-login.html';
  })
  .catch(error => {
    console.error('Ошибка выхода:', error);
    alert('Ошибка выхода из аккаунта');
  });
}