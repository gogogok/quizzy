import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import { Logo } from '../components/Header';
import { useAuth } from '../context/AuthContext';
export default function RegisterPage() {
  const nav = useNavigate(),
    { register } = useAuth(),
    [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await register({
        name: e.target.name.value,
        email: e.target.email.value,
        password: e.target.password.value,
        role: 'PARTICIPANT',
      });
      nav('/dashboard');
    } catch (x) {
      setError(x.message);
    }
  }
  return (
    <div className="auth">
      <section className="auth-pane">
        <div className="auth-box">
          <Logo />
          <h1>Создать аккаунт</h1>
          <p>Один аккаунт — создавайте свои квизы и участвуйте в чужих</p>
          <form onSubmit={submit}>
            <Input name="name" label="Имя" placeholder="Иван Петров" required />
            <Input name="email" label="Email" type="email" placeholder="name@mail.ru" required />
            <Input
              name="password"
              label="Пароль"
              type="password"
              minLength="8"
              placeholder="Не менее 8 символов"
              required
            />
            {error && <p className="form-error">{error}</p>}
            <button className="btn primary wide">Зарегистрироваться</button>
          </form>
          <p>
            Уже есть аккаунт?{' '}
            <Link className="eyebrow" to="/login">
              Войти
            </Link>
          </p>
        </div>
      </section>
      <section className="auth-visual">
        <div>
          <div className="trophy">🎯</div>
          <h2>Создавайте и участвуйте</h2>
        </div>
      </section>
    </div>
  );
}
