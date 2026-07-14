import { useEffect, useState } from 'react';

export default function Timer({ startedAt, duration = 15, stopped = false }) {
  const calculate = () =>
    Math.max(0, Math.ceil(duration - (Date.now() - new Date(startedAt).getTime()) / 1000));
  const [seconds, setSeconds] = useState(startedAt ? calculate() : duration);

  useEffect(() => {
    setSeconds(startedAt ? calculate() : duration);
    if (!startedAt || stopped) return;
    const interval = window.setInterval(() => setSeconds(calculate()), 250);
    return () => window.clearInterval(interval);
  }, [startedAt, duration, stopped]);

  const value = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <b className={`live-timer ${seconds <= 5 ? 'ending' : ''}`}>◷ {value}</b>;
}
