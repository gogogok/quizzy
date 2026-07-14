import { Link } from 'react-router-dom';
import Header from '../components/Header';
const features = [
  ['🚀', 'Простое создание', 'Создавайте квизы любой сложности'],
  ['❔', 'Разные типы вопросов', 'Текст, изображения и несколько ответов'],
  ['◷', 'Реальное время', 'Все участники отвечают одновременно'],
  ['📊', 'Рейтинг и результаты', 'Следите за баллами и победителями'],
];
const steps = [
  ['1', 'Создайте квиз', 'Добавьте вопросы, варианты ответов, изображения и настройте время.'],
  ['2', 'Откройте комнату', 'Получите короткий код и отправьте его участникам.'],
  ['3', 'Играйте вместе', 'Показывайте вопросы и следите за ответами в реальном времени.'],
  ['4', 'Узнайте победителей', 'Сервис автоматически подсчитает баллы и сформирует рейтинг.'],
];
export default function HomePage() {
  return (
    <div className="app">
      <Header />
      <main>
        <div className="container">
          <section className="hero">
            <div>
              <span className="eyebrow">КВИЗЫ В РЕАЛЬНОМ ВРЕМЕНИ</span>
              <h1>
                Проводите квизы
                <br />и играйте с друзьями
              </h1>
              <p className="lead">
                Создавайте увлекательные квизы, подключайте участников и узнавайте, кто самый
                эрудированный!
              </p>
              <div className="actions hero-actions">
                <Link className="btn primary" to="/quiz/create">
                  Создать квиз
                </Link>
                <Link className="btn" to="/join">
                  Присоединиться
                </Link>
              </div>
            </div>
            <div className="hero-art">
              <span className="spark s1">✦</span>
              <div className="trophy">🏆</div>
              <div className="people">🙋‍♂️ 🙋‍♀️ 🙋</div>
              <span className="spark s2">◆</span>
            </div>
          </section>
          <section className="home-section" id="features">
            <div className="home-section-title">
              <span className="eyebrow">ВОЗМОЖНОСТИ</span>
              <h2>Всё необходимое для живого квиза</h2>
              <p>От первого вопроса до итоговой таблицы — в одном сервисе.</p>
            </div>
            <div className="features">
              {features.map((item) => (
                <article className="feature" key={item[1]}>
                  <i>{item[0]}</i>
                  <h3>{item[1]}</h3>
                  <p>{item[2]}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="home-section how-section" id="how">
            <div className="home-section-title">
              <span className="eyebrow">КАК ЭТО РАБОТАЕТ</span>
              <h2>От идеи до игры за четыре шага</h2>
              <p>Никаких сложных настроек — создайте квиз и сразу пригласите участников.</p>
            </div>
            <div className="how-grid">
              {steps.map((item) => (
                <article className="how-card" key={item[0]}>
                  <span>{item[0]}</span>
                  <div>
                    <h3>{item[1]}</h3>
                    <p>{item[2]}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="home-cta">
              <div>
                <h2>Готовы начать?</h2>
                <p>Создайте первый квиз или подключитесь к уже открытой комнате.</p>
              </div>
              <div className="actions">
                <Link className="btn primary" to="/quiz/create">
                  Создать квиз
                </Link>
                <Link className="btn" to="/join">
                  Ввести код
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
