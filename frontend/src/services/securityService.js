import { api, jsonPost } from './api.js';
export const securityService = {
  gradeAvailability: (mode, courseCode) => api(`/api/sql/${mode}/grade-availability?courseCode=${encodeURIComponent(courseCode)}`),
  studentRecords: (mode, rollNo) => api(`/api/sql/${mode}/student-records?rollNo=${encodeURIComponent(rollNo)}`),
  profileSession: () => api('/api/lab/session', { method: 'POST' }),
  profile: () => api('/api/lab/profile'),
  updateRecoveryEmail: (mode, recoveryEmail, token) => api(`/api/lab/${mode}/recovery-email`, jsonPost({ recoveryEmail }, mode === 'safe' ? { 'x-csrf-token': token } : {}))
};
