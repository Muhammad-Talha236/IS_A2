let securityMode = 'safe';
export const setApiMode = mode => { securityMode = mode; };
export async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'include', ...options, headers: { 'x-security-mode': securityMode, ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed (HTTP ${response.status})`);
    error.status = response.status;
    if (response.status === 401 && !path.endsWith('/login')) window.dispatchEvent(new Event('session-expired'));
    throw error;
  }
  return data;
}
export const jsonPost = (body, headers = {}) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
