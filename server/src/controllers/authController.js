import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
  role: z.enum(['PARTICIPANT', 'ORGANIZER']).default('PARTICIPANT'),
});
const loginSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});
const tokenFor = (u) =>
  jwt.sign({ id: u.id, email: u.email, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
export async function register(req, res) {
  const data = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
  const { password, ...profile } = data;
  const user = await prisma.user.create({
    data: { ...profile, passwordHash: await bcrypt.hash(password, 12) },
  });
  res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
}
export async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash)))
    return res.status(401).json({ message: 'Неверный email или пароль' });
  res.json({ token: tokenFor(user), user: publicUser(user) });
}
export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
  res.json({ user: publicUser(user) });
}
