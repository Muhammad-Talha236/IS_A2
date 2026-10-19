import { useEffect, useState } from 'react';
export function readPreviewFragment(hash) {
  const match = hash.match(/(?:^#|&)preview=([^&]*)/);
  if (!match) return '';
  try { return decodeURIComponent(match[1]); } catch { return match[1]; }
}
export function useAnnouncementPreview() {
  const [fragment, setFragment] = useState('');
  useEffect(() => {
    const update = () => setFragment(readPreviewFragment(window.location.hash));
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const preview = value => { window.location.hash = `preview=${encodeURIComponent(value)}`; };
  return { fragment, preview };
}
