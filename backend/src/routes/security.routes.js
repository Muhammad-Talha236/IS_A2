import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { gradeAvailability } from '../security/intermediateSqlInjection.js';
import { studentRecords } from '../security/advancedSqlInjection.js';
const router = Router();
router.post('/:mode/login', login);
router.get('/:mode/grade-availability', gradeAvailability);
router.get('/:mode/student-records', studentRecords);
export default router;
