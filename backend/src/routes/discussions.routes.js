import { Router } from 'express';
import { listDiscussions, createDiscussion } from '../controllers/discussions.controller.js';
const router = Router();
router.get('/', listDiscussions);
router.post('/', createDiscussion);
export default router;
