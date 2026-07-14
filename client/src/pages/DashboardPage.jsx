import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shell } from '../components/Sidebar';
import QuizCard from '../components/QuizCard';
import { quizApi } from '../services/api';
const filters = [
  ['ALL', 'Все'],
  ['DRAFT', 'Черновики'],
  ['PUBLISHED', 'Опубликованные'],
  ['ACTIVE', 'Активные'],
  ['FINISHED', 'Завершённые'],
];
export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState([]),
    [filter, setFilter] = useState('ALL'),
    [error, setError] = useState(''),
    [starting, setStarting] = useState(null),
    nav = useNavigate();
  useEffect(() => {
    quizApi
      .list()
      .then(setQuizzes)
      .catch((e) => (e.message.includes('автор') ? nav('/login') : setError(e.message)));
  }, [nav]);
  const visible = useMemo(
    () => (filter === 'ALL' ? quizzes : quizzes.filter((q) => q.status === filter)),
    [quizzes, filter],
  );
  async function start(quiz) {
    if (quiz.status === 'DRAFT') return setError('Сначала опубликуйте квиз');
    setStarting(quiz.id);
    setError('');
    try {
      const s = await quizApi.createSession(quiz.id);
      sessionStorage.setItem('roomCode', s.roomCode);
      sessionStorage.setItem('hostRoomCode', s.roomCode);
      nav('/lobby');
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(null);
    }
  }
  return (
    <Shell>
      <div className="page-head">
        <div>
          <p className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</p>
          <h1>Мои квизы</h1>
        </div>
        <Link className="btn primary" to="/quiz/create">
          ＋ Создать квиз
        </Link>
      </div>
      <div className="tabs dashboard-tabs">
        {filters.map(([value, label]) => (
          <button
            key={value}
            className={`tab ${filter === value ? 'active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="quiz-list">
        {visible.map((q) => (
          <div className={starting === q.id ? 'is-loading' : ''} key={q.id}>
            <QuizCard quiz={q} onStart={start} />
          </div>
        ))}
        {!visible.length && !error && (
          <div className="card empty-state">
            {filter === 'ALL'
              ? 'У вас пока нет квизов. Создайте первый!'
              : 'В этой категории пока нет квизов.'}
          </div>
        )}
      </div>
    </Shell>
  );
}
