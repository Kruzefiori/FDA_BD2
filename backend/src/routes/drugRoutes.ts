// src/routes/userRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as drugController from '../controllers/drugController';

const router = Router();

router.get('/search', authenticateToken, (req, res, next) => {
  Promise.resolve(drugController.getDrugs(req, res)).catch(next);
});

export default router;
