import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quizController.js';
import {
  createSession,
  sessionResults,
  history,
  participationHistory,
} from '../controllers/sessionController.js';
const r = Router();
r.use(auth);
r.get('/', listQuizzes);
r.get('/history', history);
r.get('/participation-history', participationHistory);
r.get('/:id', getQuiz);
r.post('/', createQuiz);
r.put('/:id', updateQuiz);
r.delete('/:id', deleteQuiz);
r.post('/:quizId/sessions', createSession);
r.get('/sessions/:id/results', sessionResults);
export default r;
