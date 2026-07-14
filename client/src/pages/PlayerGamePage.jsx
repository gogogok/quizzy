import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Timer from '../components/Timer';
import { emitAck, getSocket } from '../services/socket';

export default function PlayerGamePage() {
  const navigate = useNavigate();
  const roomCode = sessionStorage.getItem('roomCode');
  const [game, setGame] = useState(null),
    [selected, setSelected] = useState([]);
  const [status, setStatus] = useState('Ожидаем вопрос…'),
    [error, setError] = useState('');

  useEffect(() => {
    const socket = getSocket();
    const active = (payload) => {
      setGame(payload);
      setSelected([]);
      setStatus('Выберите ответ');
      setError('');
    };
    const closed = (payload) => {
      setStatus('Вопрос закрыт');
      setGame((value) =>
        value ? { ...value, correctOptionIds: payload.correctOptionIds, closed: true } : value,
      );
    };
    const finished = (payload) => {
      sessionStorage.setItem('results', JSON.stringify(payload.leaderboard));
      navigate('/results');
    };
    socket.on('question:active', active);
    socket.on('question:closed', closed);
    socket.on('quiz:finished', finished);
    emitAck('room:join', {
      roomCode,
      nickname: sessionStorage.getItem('nickname') || 'Игрок',
      participantId: Number(sessionStorage.getItem('participantId')) || undefined,
      reconnectToken: sessionStorage.getItem('reconnectToken') || undefined,
    })
      .then((result) => {
        sessionStorage.setItem('participantId', result.participant.id);
        sessionStorage.setItem('reconnectToken', result.participant.reconnectToken);
        if (result.game) active(result.game);
      })
      .catch((requestError) => setError(requestError.message));
    return () => {
      socket.off('question:active', active);
      socket.off('question:closed', closed);
      socket.off('quiz:finished', finished);
    };
  }, [navigate]);

  function choose(id) {
    if (status !== 'Выберите ответ') return;
    setSelected((items) =>
      game.question.type === 'SINGLE'
        ? [id]
        : items.includes(id)
          ? items.filter((item) => item !== id)
          : [...items, id],
    );
  }
  async function submit() {
    try {
      await emitAck('answer:submit', { roomCode, optionIds: selected });
      setStatus('Ответ принят ✓');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (!game)
    return (
      <div className="join">
        <div className="join-box">
          <div className="trophy">⏳</div>
          <h1>{status}</h1>
          <p>Организатор скоро покажет вопрос</p>
        </div>
      </div>
    );
  return (
    <div className="dark-game">
      <div className="game-grid single-game">
        <section className="question-panel">
          <div className="game-question-head">
            <b>
              Вопрос {game.number} из {game.total}
            </b>
            <Timer
              startedAt={game.startedAt}
              duration={game.question.timeLimit}
              stopped={game.closed}
            />
          </div>
          <div className="progress timer-progress">
            <span
              key={game.startedAt}
              style={{ animationDuration: `${game.question.timeLimit}s` }}
            />
          </div>
          <div className="game-card">
            <h2>{game.question.text}</h2>
            {game.question.imageUrl && (
              <img className="question-image" src={game.question.imageUrl} alt="Вопрос" />
            )}
            {game.question.options.map((option) => (
              <div
                onClick={() => choose(option.id)}
                className={`answer ${selected.includes(option.id) ? 'selected' : ''}${game.correctOptionIds?.includes(option.id) ? ' correct' : ''}`}
                key={option.id}
              >
                ◯ &nbsp; {option.text}
              </div>
            ))}
            {error && <p className="form-error">{error}</p>}
            <button
              disabled={!selected.length || status !== 'Выберите ответ'}
              onClick={submit}
              className="btn primary wide"
            >
              {status}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
