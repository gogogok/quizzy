const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function createRoomCode(length = 5) {
  return Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}
