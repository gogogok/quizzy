import {Link} from 'react-router-dom';
export const Logo=()=> <Link className="brand" to="/"><span className="brand-mark">Q</span>Quizzy</Link>;
export default function Header(){return <header className="topbar"><Logo/><nav className="nav"><a href="#features">Возможности</a><a href="#how">Как это работает</a><Link to="/join">Присоединиться</Link></nav><div className="actions"><Link className="btn ghost" to="/login">Войти</Link><Link className="btn primary" to="/register">Регистрация</Link></div></header>}
