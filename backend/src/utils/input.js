export const isMode = mode => ['vulnerable', 'safe'].includes(mode);
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
export const validRecoveryEmail = email => email.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
