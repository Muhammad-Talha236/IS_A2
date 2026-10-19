import { Router } from 'express';
import { listCourses, listAssessments } from '../controllers/courses.controller.js';
import { searchCourses } from '../security/reflectedXss.js';
const router = Router();
router.get('/courses', listCourses);
router.get('/assessments', listAssessments);
router.get('/:mode/search', searchCourses);
export default router;
