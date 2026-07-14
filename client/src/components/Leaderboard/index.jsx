export const players = [
  ['Анна', 1860],
  ['Дмитрий', 1740],
  ['Мария', 1530],
  ['Алексей', 1380],
  ['Екатерина', 1250],
];
export default function Leaderboard({ playersOverride }) {
  const list = playersOverride?.map((p) => [p.nickname, p.score]) || players;
  return (
    <aside className="leader">
      <b>
        Участники <span className="badge">{list.length}</span>
      </b>
      {list.map((p, i) => (
        <div className="leader-row" key={p[0]}>
          <span>{i + 1}</span>
          <span>● &nbsp;{p[0]}</span>
          <b>{p[1]}</b>
        </div>
      ))}
    </aside>
  );
}
