// src/routes/userRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as userController from '../controllers/userController';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/get', authenticateToken, userController.getUsers);
router.put('/update/:id', authenticateToken, userController.updateUser);
router.delete('/delete/:id', authenticateToken, userController.deleteUser);

export default router;
