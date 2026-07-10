import {NavLink} from 'react-router-dom';import {Logo} from '../Header';
const links=[['⌂','Главная','/dashboard'],['▣','Мои квизы','/dashboard'],['◷','История','/profile'],['▤','Создать квиз','/quiz/create'],['♙','Профиль','/profile']];
export default function Sidebar(){return <aside className="sidebar"><Logo/>{links.map(([i,n,to],x)=><NavLink key={x} className={({isActive})=>'side-link '+(isActive?'active':'')} to={to}><span className="side-icon">{i}</span>{n}</NavLink>)}<NavLink className="side-link" to="/"><span className="side-icon">↪</span>Выйти</NavLink></aside>}
export function Shell({children}){return <div className="shell"><Sidebar/><main className="main">{children}</main></div>}
