import { prisma } from '../utils/prisma.js';
import { createRoomCode } from '../utils/roomCode.js';
async function uniqueCode() {
  for (let i = 0; i < 10; i++) {
    const roomCode = createRoomCode();
    if (!(await prisma.quizSession.findUnique({ where: { roomCode } }))) return roomCode;
  }
  throw new Error('Не удалось создать код комнаты');
}
export async function createSession(req, res) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: Number(req.params.quizId), organizerId: req.user.id },
    include: {
      questions: true,
      sessions: { where: { status: { in: ['LOBBY', 'ACTIVE'] } }, select: { id: true } },
    },
  });
  if (!quiz) return res.status(404).json({ message: 'Квиз не найден' });
  if (quiz.status === 'DRAFT') return res.status(400).json({ message: 'Сначала опубликуйте квиз' });
  if (!quiz.questions.length)
    return res.status(400).json({ message: 'Добавьте хотя бы один вопрос' });
  if (quiz.sessions.length)
    return res.status(409).json({ message: 'У этого квиза уже есть незавершённая комната' });
  if (quiz.status !== 'PUBLISHED')
    await prisma.quiz.update({ where: { id: quiz.id }, data: { status: 'PUBLISHED' } });
  const session = await prisma.quizSession.create({
    data: { quizId: quiz.id, roomCode: await uniqueCode() },
  });
  res.status(201).json(session);
}
export async function publicSession(req, res) {
  const session = await prisma.quizSession.findUnique({
    where: { roomCode: req.params.code.toUpperCase() },
    include: {
      quiz: { select: { title: true, description: true } },
      participants: { select: { id: true, nickname: true, score: true } },
      results: {
        orderBy: { place: 'asc' },
        include: { participant: { select: { id: true, nickname: true } } },
      },
    },
  });
  if (!session) return res.status(404).json({ message: 'Комната не найдена' });
  res.json(session);
}
export async function sessionResults(req, res) {
  const session = await prisma.quizSession.findFirst({
    where: { id: Number(req.params.id), quiz: { organizerId: req.user.id } },
    include: {
      quiz: { select: { title: true } },
      results: {
        orderBy: { place: 'asc' },
        include: { participant: { select: { nickname: true } } },
      },
    },
  });
  if (!session) return res.status(404).json({ message: 'Сессия не найдена' });
  res.json(session);
}
export async function history(req, res) {
  res.json(
    await prisma.quizSession.findMany({
      where: { quiz: { organizerId: req.user.id }, status: 'FINISHED' },
      include: { quiz: { select: { title: true } }, _count: { select: { participants: true } } },
      orderBy: { finishedAt: 'desc' },
    }),
  );
}
export async function participationHistory(req, res) {
  res.json(
    await prisma.quizResult.findMany({
      where: { participant: { is: { userId: req.user.id } } },
      include: {
        session: {
          select: { roomCode: true, finishedAt: true, quiz: { select: { title: true } } },
        },
        participant: { select: { nickname: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  );
}
