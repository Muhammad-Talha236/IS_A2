import { useEffect, useState } from 'react';
const valid = ['dashboard', 'courses', 'search', 'discussions', 'announcements', 'grades', 'records', 'profile', 'guide'];
const current = () => { const page = new URLSearchParams(location.search).get('page'); return valid.includes(page) ? page : 'dashboard'; };
export function useNavigation() {
  const [page, setPage] = useState(current);
  useEffect(() => { const update = () => setPage(current()); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update); }, []);
  function navigate(next) {
    if (!valid.includes(next)) return;
    const url = new URL(location.href);
    url.searchParams.set('page', next);
    history.pushState({}, '', url);
    setPage(next);
    window.scrollTo({ top: 0 });
  }
  return { page, navigate };
}
