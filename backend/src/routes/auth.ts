import { Router } from 'express';
import { prisma } from '../shared/prisma.js';
import { signJwt, authMiddleware } from '../shared/auth.js';

export const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, id } = req.body as { email?: string; id?: string };
    if (!email && !id) return res.status(400).json({ message: 'Provide email or id' });
    const user = await prisma.user.findFirst({ where: { OR: [{ email: email || '' }, { id: id || '' }] } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signJwt({ id: user.id, role: user.role, walletAddress: user.walletAddress, email: user.email, name: user.name });
    res.json({ token, user: { id: user.id, role: user.role, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req: any, res) => {
  res.json({ user: req.user });
});
