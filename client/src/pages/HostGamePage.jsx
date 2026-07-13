import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';
import Timer from '../components/Timer';
import { emitAck, getSocket } from '../services/socket';

export default function HostGamePage() {
  const navigate = useNavigate();
  const roomCode = sessionStorage.getItem('roomCode');
  const [game, setGame] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    emitAck('host:join', { roomCode }).then((result) => { setLeaders(result.participants); if(result.game){setGame(result.game);setClosed(false)} }).catch((e) => setError(e.message));
    const socket = getSocket();
    const onClosed = (payload) => { setClosed(true); setLeaders(payload.leaderboard); };
    const onFinished = (payload) => sessionStorage.setItem('results', JSON.stringify(payload.leaderboard));
    socket.on('question:closed', onClosed);
    socket.on('quiz:finished', onFinished);
    return () => { socket.off('question:closed', onClosed); socket.off('quiz:finished', onFinished); };
  }, [roomCode]);

  async function next() {
    try {
      setError('');
      const result = await emitAck('question:show', { roomCode });
      setGame(result.game);
      setClosed(false);
    } catch (requestError) {
      if (requestError.message === 'Вопросы закончились') await finish();
      else setError(requestError.message);
    }
  }

  async function close() {
    try { await emitAck('question:close', { roomCode }); }
    catch (requestError) { setError(requestError.message); }
  }

  async function finish() {
    try {
      const result = await emitAck('quiz:finish', { roomCode });
      sessionStorage.setItem('results', JSON.stringify(result.leaderboard));
      navigate('/results');
    } catch (requestError) { setError(requestError.message); }
  }

  return <div className="dark-game">
    <div className="game-top"><span>Код комнаты: <b>{roomCode}</b></span><div className="actions"><button onClick={close} disabled={!game || closed} className="btn">Закрыть вопрос</button><button onClick={finish} className="btn">Завершить</button></div></div>
    {error && <p className="form-error">{error}</p>}
    <div className="game-grid"><section className="question-panel">
      {game ? <><div className="game-question-head"><b>Вопрос {game.number} из {game.total}</b><Timer startedAt={game.startedAt} duration={game.question.timeLimit} stopped={closed} /></div><div className="progress timer-progress"><span key={game.startedAt} style={{ animationDuration: `${game.question.timeLimit}s` }} /></div><div className="game-card"><h2>{game.question.text}</h2>{game.question.imageUrl && <img className="question-image" src={game.question.imageUrl} alt="Вопрос" />}{game.question.options.map((option) => <div className="answer" key={option.id}>{option.text}</div>)}{closed && <div className="question-closed-note">Вопрос закрыт — ответы больше не принимаются</div>}</div></> : <div className="game-card waiting-card"><h2>Квиз запущен</h2><p>Покажите первый вопрос всем участникам</p></div>}
      <button className="btn primary wide" onClick={next} disabled={game && !closed} style={{ marginTop: 15 }}>{game ? 'Следующий вопрос' : 'Показать первый вопрос'}</button>
    </section><Leaderboard playersOverride={leaders} /></div>
  </div>;
}
