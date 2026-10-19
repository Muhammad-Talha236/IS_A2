import { useEffect, useState } from 'react';
import { courseService } from '../services/courseService.js';
export function useAcademicData() {
  const [data, setData] = useState({ courses: [], assessments: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([courseService.courses(), courseService.assessments()])
      .then(([courses, assessments]) => { if (active) setData({ courses, assessments }); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { ...data, error, loading };
}
