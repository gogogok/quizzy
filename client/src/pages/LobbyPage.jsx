import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Header';
import { emitAck, getSocket } from '../services/socket';
export default function LobbyPage() {
  const nav = useNavigate(),
    code = sessionStorage.getItem('roomCode') || '',
    isHost = sessionStorage.getItem('hostRoomCode') === code,
    [participants, setParticipants] = useState([]),
    [error, setError] = useState('');
  useEffect(() => {
    const socket = getSocket(),
      joined = (data) => setParticipants(data.participants || []),
      started = () => nav(isHost ? '/host' : '/play');
    socket.on('participant:joined', joined);
    socket.on('quiz:started', started);
    const connect = isHost
      ? emitAck('host:join', { roomCode: code })
      : emitAck('room:join', {
          roomCode: code,
          nickname: sessionStorage.getItem('nickname') || 'Игрок',
          participantId: Number(sessionStorage.getItem('participantId')) || undefined,
          reconnectToken: sessionStorage.getItem('reconnectToken') || undefined,
        });
    connect
      .then((result) => {
        if (result.participants) setParticipants(result.participants);
        if (result.participant) {
          sessionStorage.setItem('participantId', result.participant.id);
          sessionStorage.setItem('reconnectToken', result.participant.reconnectToken);
        }
        if (result.game) nav(isHost ? '/host' : '/play');
      })
      .catch((e) => setError(e.message));
    return () => {
      socket.off('participant:joined', joined);
      socket.off('quiz:started', started);
    };
  }, [code, isHost, nav]);
  async function start() {
    try {
      await emitAck('quiz:start', { roomCode: code });
      nav('/host');
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="join">
      <div className="join-box lobby-shell">
        <Logo />
        <p className="eyebrow lobby-code-label">КОД КОМНАТЫ</p>
        <h1 className="room-code">{code || '—'}</h1>
        <div className="card lobby-card">
          <div className="lobby-loader">
            <span />
            <span />
            <span />
          </div>
          <h2>{isHost ? 'Участники подключаются…' : 'Ожидаем организатора…'}</h2>
          <div className="participant-chips">
            {participants.map((p) => (
              <span key={p.id}>● {p.nickname}</span>
            ))}
          </div>
          <h3>{participants.length} участников</h3>
        </div>
        {error && <p className="form-error">{error}</p>}
        {isHost && (
          <button onClick={start} className="btn primary wide lobby-start">
            Начать квиз
          </button>
        )}
        <p className="empty-note">Игра начнётся одновременно на всех устройствах</p>
      </div>
    </div>
  );
}
