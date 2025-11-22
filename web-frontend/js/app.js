window.escapeHtml = function(s){
  return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
};

window.showAlert = function(msg, type='info', placeholderId='alert-placeholder') {
  const alertPlace = document.getElementById(placeholderId);
  if (!alertPlace) {
    console.warn(`No se encontró el placeholder de alerta con ID: ${placeholderId}. Mensaje: ${msg}`);
    alert(msg); 
    return;
  }
  alertPlace.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${window.escapeHtml(msg)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;

  setTimeout(()=> {
      const currentAlert = alertPlace.querySelector('.alert');
      if (currentAlert && currentAlert.classList.contains('show')) {
          currentAlert.classList.remove('show');
          currentAlert.classList.add('fade');
          currentAlert.addEventListener('transitionend', () => alertPlace.innerHTML = '', { once: true });
      } else {
          alertPlace.innerHTML = ''; 
      }
  }, 4000);
};


// --- Configuración de entorno y otras funciones globales ---
window.__env = {
  //API_BASE_URL: 'http://localhost:8080',
  API_BASE_URL: 'http://ms-clientes-visitas-env2.eba-ie2e5n2t.us-east-1.elasticbeanstalk.com', 
  
  GOOGLE_MAPS_API_KEY: '' // Se inicializará a través de getGoogleMapsApiKey
};

window.getToken = function() { return sessionStorage.getItem('jwt'); };
window.setToken = function(t){ sessionStorage.setItem('jwt', t); };
window.clearAuth = function(){ sessionStorage.clear(); };
window.isAuthenticated = function(){ return !!window.getToken(); };

window.requireAuth = function() {
  if (!window.isAuthenticated()) window.location = '../index.html';
};


// --- Lógica para cargar GOOGLE_MAPS_API_KEY al inicio ---
let googleMapsApiKeyPromise = null;
let cachedGoogleMapsApiKey = null;

window.getGoogleMapsApiKey = async function() {
  if (cachedGoogleMapsApiKey) {
    return cachedGoogleMapsApiKey;
  }
  if (googleMapsApiKeyPromise) {
    return googleMapsApiKeyPromise;
  }

  googleMapsApiKeyPromise = fetch(window.__env.API_BASE_URL + '/admin/settings/public/key/GOOGLE_MAPS_API_KEY', { method: 'GET', headers: {} })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo obtener la API Key de Google Maps desde el backend.`);
      }
      return res.text();
    })
    .then(key => {
      cachedGoogleMapsApiKey = key;
      window.__env.GOOGLE_MAPS_API_KEY = key; 
      return key;
    })
    .catch(error => {
      console.error('Fallo al cargar la API Key de Google Maps al inicio:', error);
      cachedGoogleMapsApiKey = '';
      window.__env.GOOGLE_MAPS_API_KEY = '';
    })
    .finally(() => {
      googleMapsApiKeyPromise = null; 
    });

  return googleMapsApiKeyPromise;
};

window.setupNavigationButtons = function() {
    document.getElementById('btnLogout')?.addEventListener('click', ()=> { window.clearAuth(); window.location='../index.html'; });
    document.getElementById('btnDashboard')?.addEventListener('click', ()=> window.location='dashboard.html');
    document.getElementById('btnVisits')?.addEventListener('click', ()=> window.location='visits.html');
    document.getElementById('btnClients')?.addEventListener('click', ()=> window.location='clients.html');
    document.getElementById('btnUsers')?.addEventListener('click', ()=> window.location='admin-users.html');
    document.getElementById('btnSettings')?.addEventListener('click', ()=> window.location='admin-settings.html');
};


document.addEventListener('DOMContentLoaded', async () => {

    await window.getGoogleMapsApiKey();
    
    window.setupNavigationButtons();
});

window.getUserRole = function() {
  const token = window.getToken();
  if (token) {
    try {

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      return payload.role ? payload.role.toUpperCase() : null;
    } catch (e) {
      console.error("Error decodificando JWT:", e);
      return null;
    }
  }
  return null;
};

// Esta función se encarga de asignar los event listeners y de mostrar/ocultar los botones.
window.setupNavigationButtons = function() {
    const userRole = window.getUserRole(); 

    // Definir qué botones son visibles para cada rol
    const navigationButtonVisibility = {
        'btnDashboard': ['ADMIN', 'SUPERVISOR', 'TECNICO', 'TECH'], 
        'btnVisits': ['ADMIN', 'SUPERVISOR', 'TECNICO', 'TECH'],   
        'btnClients': ['ADMIN'],                                   
        'btnUsers': ['ADMIN'],                                      
        'btnSettings': ['ADMIN'],                                   
        'btnLogout': ['ADMIN', 'SUPERVISOR', 'TECNICO', 'TECH']     
    };


    for (const btnId in navigationButtonVisibility) {
        const button = document.getElementById(btnId);
        if (button) {
            const allowedRoles = navigationButtonVisibility[btnId];
            
            // Si el usuario tiene un rol válido y ese rol está entre los permitidos para el botón
            if (userRole && allowedRoles.includes(userRole)) {
                button.style.display = 'block'; 
                
                // Asignar el event listener para la navegación
                if (btnId === 'btnLogout') {
                    button.onclick = () => { 
                        window.clearAuth();
                        window.location = '../index.html';
                    };
                } else {
                    button.onclick = () => {
                        // Determinar la página de destino basándose en el ID del botón
                        let targetPage = '';
                        if (btnId === 'btnDashboard') targetPage = 'dashboard.html';
                        else if (btnId === 'btnVisits') targetPage = 'visits.html';
                        else if (btnId === 'btnClients') targetPage = 'clients.html';
                        else if (btnId === 'btnUsers') targetPage = 'admin-users.html';
                        else if (btnId === 'btnSettings') targetPage = 'admin-settings.html'; 
                        
                        if (targetPage) {
                            window.location = targetPage;
                        }
                    };
                }
            } else {
                button.style.display = 'none';
            }
        }
    }
};
