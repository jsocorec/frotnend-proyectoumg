//const API_BASE = (window.__env && window.__env.API_BASE_URL) ? window.__env.API_BASE_URL : 'http://localhost:8080';
const API_BASE = (window.__env && window.__env.API_BASE_URL) ? window.__env.API_BASE_URL : 'http://Ms-clientes-visitas-env2.eba-ie2e5n2t.us-east-1.elasticbeanstalk.com';
async function apiFetch(path, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const token = sessionStorage.getItem('jwt');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  opts.headers = headers;
  const res = await fetch(API_BASE + path, opts);
  if (res.status === 401) { clearAuth(); window.location = '../index.html'; throw new Error('No autorizado'); }
  if (!res.ok) {
    const txt = await res.text();
    let message = txt;
    try { message = JSON.parse(txt); } catch(e){}
    throw new Error(message.error || message || res.statusText);
  }
  if (res.status === 204) return null;
  const data = await res.json();
  return data;
}

async function apiGet(path) { return apiFetch(path, { method: 'GET' }); }
async function apiPost(path, body) { return apiFetch(path, { method: 'POST', body: JSON.stringify(body) }); }
async function apiPut(path, body) { return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }); }
async function apiDelete(path) { return apiFetch(path, { method: 'DELETE' }); }