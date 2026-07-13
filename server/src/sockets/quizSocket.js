import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { calculatePoints } from '../utils/points.js';

const joinSchema = z.object({
  roomCode: z.string().trim().length(5).transform((value) => value.toUpperCase()),
  nickname: z.string().trim().min(2).max(30),
  participantId: z.number().int().positive().optional(),
  reconnectToken: z.string().uuid().optional(),
});
const roomSchema = z.object({ roomCode: z.string().trim().length(5).transform((value) => value.toUpperCase()) });
const answerSchema = z.object({ roomCode: z.string().trim().length(5).transform((value) => value.toUpperCase()), optionIds: z.array(z.number().int().positive()).min(1) });
const questionTimers = new Map();
const ackError = (ack, error) => typeof ack === 'function' && ack({ ok: false, error: error.code === 'P2002' ? 'Ответ уже был отправлен' : error.message || 'Ошибка сервера' });

const quizInclude = { quiz: { include: { questions: { orderBy: { position: 'asc' }, include: { options: true } } } } };
async function ownedSession(roomCode, userId) { return prisma.quizSession.findFirst({ where: { roomCode, quiz: { organizerId: userId } }, include: quizInclude }); }
function safeQuestion(question) { return { id: question.id, text: question.text, imageUrl: question.imageUrl, type: question.type, timeLimit: question.timeLimit, points: question.points, options: [...question.options].sort((a, b) => a.position - b.position).map(({ id, text, position }) => ({ id, text, position })) }; }
function gameFromSession(session) { const question = session.quiz?.questions?.[session.currentQuestion]; return session.status === 'ACTIVE' && question && session.questionStartedAt ? { question: safeQuestion(question), number: session.currentQuestion + 1, total: session.quiz.questions.length, startedAt: session.questionStartedAt.toISOString() } : null; }
async function leaderboard(sessionId) { return prisma.participant.findMany({ where: { sessionId }, select: { id: true, nickname: true, score: true }, orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }] }); }

async function closeActiveQuestion(io, sessionId, roomCode) {
  const session = await prisma.quizSession.findUnique({ where: { id: sessionId }, include: quizInclude });
  if (!session?.questionStartedAt) return null;
  const question = session.quiz.questions[session.currentQuestion];
  if (!question) return null;
  const updated = await prisma.quizSession.updateMany({ where: { id: sessionId, questionStartedAt: { not: null } }, data: { questionStartedAt: null } });
  if (!updated.count) return null;
  clearTimeout(questionTimers.get(sessionId));
  questionTimers.delete(sessionId);
  const payload = { correctOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id), leaderboard: await leaderboard(sessionId) };
  io.to(roomCode).emit('question:closed', payload);
  return payload;
}

function scheduleClose(io, session) {
  const game = gameFromSession(session);
  if (!game) return;
  clearTimeout(questionTimers.get(session.id));
  const remaining = new Date(game.startedAt).getTime() + game.question.timeLimit * 1000 - Date.now();
  if (remaining <= 0) closeActiveQuestion(io, session.id, session.roomCode).catch(console.error);
  else questionTimers.set(session.id, setTimeout(() => closeActiveQuestion(io, session.id, session.roomCode).catch(console.error), remaining));
}

export function registerQuizSocket(io) {
  io.use((socket, next) => { const token = socket.handshake.auth?.token; if (token) try { socket.user = jwt.verify(token, process.env.JWT_SECRET); } catch {} next(); });
  io.on('connection', (socket) => {
    socket.on('room:join', async (payload, ack) => {
      try {
        const data = joinSchema.parse(payload);
        const session = await prisma.quizSession.findUnique({ where: { roomCode: data.roomCode }, include: quizInclude });
        if (!session || session.status === 'FINISHED') throw new Error('Комната недоступна');
        if (socket.user?.id === session.quiz.organizerId) throw new Error('Создатель квиза управляет игрой и не может участвовать в ней');
        let participant = null;
        if (data.participantId && data.reconnectToken) participant = await prisma.participant.findFirst({ where: { id: data.participantId, reconnectToken: data.reconnectToken, sessionId: session.id } });
        if (participant) participant = await prisma.participant.update({ where: { id: participant.id }, data: { socketId: socket.id, nickname: data.nickname, userId: socket.user?.id || participant.userId } });
        else participant = await prisma.participant.create({ data: { nickname: data.nickname, socketId: socket.id, sessionId: session.id, userId: socket.user?.id || null } });
        socket.join(data.roomCode); socket.data.participantId = participant.id; socket.data.roomCode = data.roomCode;
        const participants = await leaderboard(session.id);
        io.to(data.roomCode).emit('participant:joined', { participant: { id: participant.id, nickname: participant.nickname }, participants });
        scheduleClose(io, session);
        ack?.({ ok: true, participant: { id: participant.id, nickname: participant.nickname, score: participant.score, reconnectToken: participant.reconnectToken }, session: { status: session.status, currentQuestion: session.currentQuestion }, game: gameFromSession(session) });
      } catch (error) { ackError(ack, error); }
    });

    socket.on('host:join', async (payload, ack) => {
      try { if (!socket.user) throw new Error('Требуется авторизация'); const { roomCode } = roomSchema.parse(payload); const session = await ownedSession(roomCode, socket.user.id); if (!session) throw new Error('Комната не найдена'); socket.join(roomCode); scheduleClose(io, session); ack?.({ ok: true, session: { id: session.id, status: session.status, currentQuestion: session.currentQuestion }, game: gameFromSession(session), participants: await leaderboard(session.id) }); }
      catch (error) { ackError(ack, error); }
    });

    socket.on('quiz:start', async (payload, ack) => {
      try { if (!socket.user) throw new Error('Требуется авторизация'); const { roomCode } = roomSchema.parse(payload); const session = await ownedSession(roomCode, socket.user.id); if (!session) throw new Error('Комната не найдена'); const updated = await prisma.quizSession.update({ where: { id: session.id }, data: { status: 'ACTIVE', startedAt: new Date(), currentQuestion: -1, questionStartedAt: null } }); io.to(roomCode).emit('quiz:started', { sessionId: updated.id }); ack?.({ ok: true }); }
      catch (error) { ackError(ack, error); }
    });

    socket.on('question:show', async (payload, ack) => {
      try { if (!socket.user) throw new Error('Требуется авторизация'); const { roomCode } = roomSchema.parse(payload); const session = await ownedSession(roomCode, socket.user.id); if (!session || session.status !== 'ACTIVE') throw new Error('Сессия не запущена'); if (session.questionStartedAt) throw new Error('Сначала дождитесь окончания текущего вопроса'); const index = session.currentQuestion + 1, question = session.quiz.questions[index]; if (!question) throw new Error('Вопросы закончились'); const startedAt = new Date(); const updated = await prisma.quizSession.update({ where: { id: session.id }, data: { currentQuestion: index, questionStartedAt: startedAt }, include: quizInclude }); const game = gameFromSession(updated); io.to(roomCode).emit('question:active', game); scheduleClose(io, updated); ack?.({ ok: true, game }); }
      catch (error) { ackError(ack, error); }
    });

    socket.on('answer:submit', async (payload, ack) => {
      try {
        const data = answerSchema.parse(payload);
        if (!socket.data.participantId || socket.data.roomCode !== data.roomCode) throw new Error('Сначала подключитесь к комнате');
        const session = await prisma.quizSession.findUnique({ where: { roomCode: data.roomCode }, include: quizInclude });
        if (!session || session.status !== 'ACTIVE' || !session.questionStartedAt) throw new Error('Сейчас нельзя отвечать');
        const participant = await prisma.participant.findFirst({ where: { id: socket.data.participantId, sessionId: session.id, socketId: socket.id } });
        if (!participant) throw new Error('Участник не найден');
        const question = session.quiz.questions[session.currentQuestion], elapsed = Date.now() - session.questionStartedAt.getTime();
        if (!question || elapsed > question.timeLimit * 1000) throw new Error('Время ответа истекло');
        const valid = question.options.filter((option) => data.optionIds.includes(option.id));
        if (valid.length !== new Set(data.optionIds).size) throw new Error('Некорректный вариант');
        const correctIds = question.options.filter((option) => option.isCorrect).map((option) => option.id).sort(), selected = [...data.optionIds].sort();
        const isCorrect = correctIds.length === selected.length && correctIds.every((id, index) => id === selected[index]);
        const points = calculatePoints({ isCorrect, answerTime: elapsed / 1000, timeLimit: question.timeLimit, maxPoints: question.points });
        const answer = await prisma.$transaction(async (transaction) => { const created = await transaction.participantAnswer.create({ data: { participantId: participant.id, questionId: question.id, isCorrect, points, answerTimeMs: elapsed, selectedOptions: { create: selected.map((optionId) => ({ optionId })) } } }); await transaction.participant.update({ where: { id: participant.id }, data: { score: { increment: points } } }); return created; });
        ack?.({ ok: true, answer: { id: answer.id, submitted: true } });
      } catch (error) { ackError(ack, error); }
    });

    socket.on('question:close', async (payload, ack) => { try { if (!socket.user) throw new Error('Требуется авторизация'); const { roomCode } = roomSchema.parse(payload); const session = await ownedSession(roomCode, socket.user.id); if (!session) throw new Error('Комната не найдена'); const result = await closeActiveQuestion(io, session.id, roomCode); if (!result) throw new Error('Активного вопроса нет'); ack?.({ ok: true }); } catch (error) { ackError(ack, error); } });

    socket.on('quiz:finish', async (payload, ack) => {
      try { if (!socket.user) throw new Error('Требуется авторизация'); const { roomCode } = roomSchema.parse(payload); const session = await ownedSession(roomCode, socket.user.id); if (!session) throw new Error('Комната не найдена'); clearTimeout(questionTimers.get(session.id)); if (session.questionStartedAt) await closeActiveQuestion(io, session.id, roomCode); const ranked = await leaderboard(session.id); await prisma.$transaction([prisma.quizResult.deleteMany({ where: { sessionId: session.id } }), ...ranked.map((participant, index) => prisma.quizResult.create({ data: { sessionId: session.id, participantId: participant.id, score: participant.score, place: index + 1 } })), prisma.quizSession.update({ where: { id: session.id }, data: { status: 'FINISHED', finishedAt: new Date(), questionStartedAt: null } })]); io.to(roomCode).emit('quiz:finished', { leaderboard: ranked }); ack?.({ ok: true, leaderboard: ranked }); }
      catch (error) { ackError(ack, error); }
    });
  });
}
