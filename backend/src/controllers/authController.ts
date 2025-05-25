import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const user = await authService.register(name, email, password);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const { token, user } = await authService.login(email, password);
    res.json({ token, user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};