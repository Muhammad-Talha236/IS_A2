import { api, jsonPost } from './api.js';
export const courseService = {
  courses: () => api('/api/courses'),
  assessments: () => api('/api/assessments'),
  search: (mode, query) => api(`/api/${mode}/search?q=${encodeURIComponent(query)}`),
  discussions: () => api('/api/discussions'),
  postDiscussion: body => api('/api/discussions', jsonPost(body))
};
