// src/routes/userRoutes.ts
import { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as userController from '../controllers/userController';
import * as authController from '../controllers/authController';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/register', asyncHandler(authController.register));
router.post('/login', authController.login);
router.get('/get', authenticateToken, userController.getUsers);
router.put('/update/:id', authenticateToken, userController.updateUser);
router.delete('/delete/:id', authenticateToken, userController.deleteUser);

export default router;
