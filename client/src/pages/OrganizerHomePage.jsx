import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { quizApi } from '../services/api';
export default function OrganizerHomePage() {
  const { user } = useAuth(),
    [quizzes, setQuizzes] = useState([]);
  useEffect(() => {
    quizApi
      .list()
      .then(setQuizzes)
      .catch(() => {});
  }, []);
  return (
    <Shell>
      <div className="page-head">
        <div>
          <p className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</p>
          <h1>Здравствуйте, {user?.name || 'организатор'}!</h1>
        </div>
        <Link className="btn primary" to="/quiz/create">
          ＋ Создать квиз
        </Link>
      </div>
      <div className="dashboard-stats">
        <div className="card stat-card">
          <span>Всего квизов</span>
          <strong>{quizzes.length}</strong>
        </div>
        <div className="card stat-card">
          <span>Опубликовано</span>
          <strong>{quizzes.filter((q) => q.status === 'PUBLISHED').length}</strong>
        </div>
        <div className="card stat-card">
          <span>Черновиков</span>
          <strong>{quizzes.filter((q) => q.status === 'DRAFT').length}</strong>
        </div>
      </div>
      <section className="card dashboard-welcome">
        <div>
          <p className="eyebrow">БЫСТРЫЙ СТАРТ</p>
          <h2>Готовы провести новую игру?</h2>
          <p>Опубликуйте квиз, создайте комнату и поделитесь кодом.</p>
          <Link className="btn primary" to="/quizzes">
            Перейти к моим квизам
          </Link>
        </div>
        <div className="dashboard-trophy">🏆</div>
      </section>
    </Shell>
  );
}
