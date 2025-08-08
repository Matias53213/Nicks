// Configuración de la API
const API_BASE_URL = 'http://localhost:3001/api';

// Funciones comunes
function showAlert(type, message, containerId = 'alerts') {
  const alertsContainer = document.getElementById(containerId);
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.innerHTML = `<strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}`;
  alertsContainer.appendChild(alert);
  
  // Eliminar la alerta después de 5 segundos
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Página de guardar nicks
if (document.getElementById('saveButton')) {
  document.getElementById('saveButton').addEventListener('click', async () => {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    
    if (!name) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/nicks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showAlert('success', 'Nick guardado correctamente');
        nameInput.value = '';
        
        if (data.similarNicks) {
          const similarList = data.similarNicks.map(n => n.name).join(', ');
          showAlert('warning', `Nicks similares encontrados: ${similarList}`);
        }
      } else {
        showAlert('error', data.error);
      }
    } catch (error) {
      showAlert('error', 'Error al conectar con el servidor');
    }
  });
}

// Página de mostrar nicks
if (document.getElementById('showNickBtn')) {
  const showNickBtn = document.getElementById('showNickBtn');
  const nickDisplay = document.getElementById('nickDisplay');
  const counter = document.getElementById('counter');
  const resetBtn = document.getElementById('resetBtn');
  
  // Actualizar el contador
  async function updateCounter() {
    try {
      const response = await fetch(`${API_BASE_URL}/nicks/count`);
      const data = await response.json();
      
      if (data.success) {
        counter.textContent = `Mostrados: ${data.count.total - data.count.unshown} de ${data.count.total}`;
        showNickBtn.disabled = data.count.unshown === 0;
      }
    } catch (error) {
      console.error('Error al obtener el contador:', error);
    }
  }
  
  // Mostrar un nick aleatorio
  showNickBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/nicks/random`);
      const data = await response.json();
      
      if (data.success) {
        nickDisplay.textContent = data.nick;
        updateCounter();
      } else {
        showAlert('info', data.error, 'counter');
      }
    } catch (error) {
      showAlert('error', 'Error al conectar con el servidor', 'counter');
    }
  });
  
  // Reiniciar nicks mostrados
  resetBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/nicks/reset`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showAlert('info', 'Todos los nicks están disponibles para mostrar nuevamente', 'counter');
        nickDisplay.textContent = '';
        updateCounter();
      }
    } catch (error) {
      showAlert('error', 'Error al reiniciar los nicks', 'counter');
    }
  });
  
  // Inicializar contador
  updateCounter();
}