export function getCookie(name) {
  if (typeof document === 'undefined') {
    return '';
  }

  const prefix = `${name}=`;

  return document.cookie
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(prefix))
    ?.slice(prefix.length) || '';
}

export function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') {
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  document.cookie = `${name}=${value}; expires=${expiresAt.toUTCString()}; path=/; SameSite=Lax`;
}
