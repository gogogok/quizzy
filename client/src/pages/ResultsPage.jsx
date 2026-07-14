import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { quizApi } from '../services/api';
const colors = ['#8b5cf6', '#fbbf24', '#38bdf8', '#fb7185', '#34d399', '#f97316'];
export default function ResultsPage() {
  const roomCode = sessionStorage.getItem('roomCode'),
    cached = JSON.parse(sessionStorage.getItem('results') || '[]'),
    [results, setResults] = useState(cached),
    [loading, setLoading] = useState(!cached.length),
    [error, setError] = useState('');
  useEffect(() => {
    if (!roomCode) {
      setLoading(false);
      return;
    }
    quizApi
      .session(roomCode)
      .then((session) => {
        if (session.results?.length) {
          const actual = session.results.map((result) => ({
            id: result.participant.id,
            nickname: result.participant.nickname,
            score: result.score,
          }));
          setResults(actual);
          sessionStorage.setItem('results', JSON.stringify(actual));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [roomCode]);
  const podium = useMemo(
    () =>
      results.length === 1
        ? [{ player: results[0], place: 1 }]
        : results.length === 2
          ? [
              { player: results[1], place: 2 },
              { player: results[0], place: 1 },
            ]
          : [
              { player: results[1], place: 2 },
              { player: results[0], place: 1 },
              { player: results[2], place: 3 },
            ].filter((x) => x.player),
    [results],
  );
  return (
    <div className="dark-game results-page victory-screen">
      <div className="victory-glow" />
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 48 }, (_, i) => (
          <i
            key={i}
            style={{
              '--x': `${(i * 37) % 100}vw`,
              '--delay': `${(i % 12) * -0.23}s`,
              '--duration': `${2.8 + (i % 7) * 0.22}s`,
              '--color': colors[i % colors.length],
              '--rotate': `${(i * 47) % 360}deg`,
            }}
          />
        ))}
      </div>
      <div className="victory-content">
        <div className="victory-crown">👑</div>
        <p className="eyebrow">КВИЗ ЗАВЕРШЁН</p>
        <h1>{results.length ? 'Победители определены!' : 'Игра завершена'}</h1>
        <p className="results-subtitle">
          {results.length >= 3
            ? 'Поздравляем тройку лидеров!'
            : results.length === 2
              ? 'Сегодня награждаем двух финалистов!'
              : results.length === 1
                ? 'Единственный участник забирает кубок!'
                : 'Результаты появятся после участия игроков.'}
        </p>
        {loading ? (
          <div className="results-loading">Подсчитываем результаты…</div>
        ) : (
          <>
            <div className={`podium podium-count-${podium.length}`}>
              {podium.map(({ player, place }) => (
                <div
                  className={`place place-${place} ${place === 1 ? 'first' : place === 2 ? 'second' : 'third'}`}
                  key={player.id}
                >
                  <div className="winner-medal">
                    {place === 1 ? '🏆' : place === 2 ? '🥈' : '🥉'}
                  </div>
                  <div className="winner-avatar">{player.nickname.slice(0, 1).toUpperCase()}</div>
                  <span className="winner-place">{place} место</span>
                  <h3>{player.nickname}</h3>
                  <span className="score">{player.score}</span>
                  <small>баллов</small>
                </div>
              ))}
            </div>
            <div className="card results-card">
              <div className="results-card-title">
                <b>Итоговый рейтинг</b>
                <span>{results.length} участников</span>
              </div>
              {results.map((player, index) => (
                <div className={`leader-row ${index < 3 ? 'top-player' : ''}`} key={player.id}>
                  <b>{index + 1}</b>
                  <span>
                    <span className="mini-avatar">{player.nickname.slice(0, 1).toUpperCase()}</span>
                    {player.nickname}
                  </span>
                  <b>{player.score}</b>
                </div>
              ))}
              {!results.length && (
                <p>{error || 'В этой игре пока нет участников с результатами.'}</p>
              )}
            </div>
          </>
        )}
        <div className="results-actions">
          <Link to="/dashboard" className="btn primary">
            В личный кабинет
          </Link>
          <Link to="/join" className="btn victory-secondary">
            Сыграть ещё
          </Link>
        </div>
      </div>
    </div>
  );
}
