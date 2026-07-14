import { io } from 'socket.io-client';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
let socket;
export function getSocket() {
  if (!socket)
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token: localStorage.getItem('quizzy_token') },
    });
  socket.auth = { token: localStorage.getItem('quizzy_token') };
  if (!socket.connected) socket.connect();
  return socket;
}
export function emitAck(event, payload) {
  return new Promise((resolve, reject) =>
    getSocket()
      .timeout(6000)
      .emit(event, payload, (err, result) => {
        if (err) return reject(new Error('Сервер не отвечает'));
        result?.ok ? resolve(result) : reject(new Error(result?.error || 'Ошибка'));
      }),
  );
}
