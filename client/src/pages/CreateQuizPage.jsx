import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Logo } from '../components/Header';
import { quizApi } from '../services/api';

const blankQuestion = () => ({
  text: '', type: 'SINGLE', timeLimit: 15, points: 1000, imageUrl: null,
  options: [
    { text: '', isCorrect: true }, { text: '', isCorrect: false },
    { text: '', isCorrect: false }, { text: '', isCorrect: false },
  ],
});

const steps = ['Основное', 'Вопросы', 'Настройки', 'Публикация'];

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Общие знания');
  const [timeLimit, setTimeLimit] = useState(15);
  const [status, setStatus] = useState('DRAFT');
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    quizApi.get(id).then((quiz) => {
      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setCategory(quiz.category || '');
      setTimeLimit(quiz.timeLimit);
      setStatus(quiz.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');
      setQuestions(quiz.questions.length ? quiz.questions : [blankQuestion()]);
    }).catch((requestError) => setError(requestError.message));
  }, [id]);

  const updateQuestion = (key, value) => setQuestions((items) =>
    items.map((item, index) => index === selected ? { ...item, [key]: value } : item));

  const updateOption = (optionIndex, key, value) => setQuestions((items) =>
    items.map((item, index) => index === selected ? {
      ...item,
      options: item.options.map((option, i) => i === optionIndex ? { ...option, [key]: value } : option),
    } : item));

  function addOption() {
    if (question.options.length >= 8) return;
    updateQuestion('options', [...question.options, { text: '', isCorrect: false }]);
  }

  function removeOption(optionIndex) {
    if (question.options.length <= 2) return;
    const nextOptions = question.options.filter((_, index) => index !== optionIndex);
    if (!nextOptions.some((option) => option.isCorrect)) nextOptions[0].isCorrect = true;
    updateQuestion('options', nextOptions);
  }

  function changeAnswerType(type) {
    updateQuestion('type', type);
    if (type === 'SINGLE') {
      const firstCorrect = question.options.findIndex((option) => option.isCorrect);
      updateQuestion('options', question.options.map((option, index) => ({
        ...option,
        isCorrect: index === Math.max(0, firstCorrect),
      })));
    }
  }

  function loadImage(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Выберите файл изображения');
    if (file.size > 3 * 1024 * 1024) return setError('Изображение должно быть не больше 3 МБ');
    const reader = new FileReader();
    reader.onload = () => { updateQuestion('imageUrl', reader.result); setError(''); };
    reader.onerror = () => setError('Не удалось прочитать изображение');
    reader.readAsDataURL(file);
  }

  function selectCorrect(optionIndex) {
    setQuestions((items) => items.map((item, index) => index === selected ? {
      ...item,
      options: item.options.map((option, i) => ({
        ...option,
        isCorrect: item.type === 'SINGLE' ? i === optionIndex : i === optionIndex ? !option.isCorrect : option.isCorrect,
      })),
    } : item));
  }

  function removeQuestion(index) {
    if (questions.length === 1) return;
    setQuestions((items) => items.filter((_, i) => i !== index));
    setSelected((value) => Math.max(0, value > index ? value - 1 : Math.min(value, questions.length - 2)));
  }

  function validateStep() {
    if (!title.trim()) return 'Укажите название квиза';
    if (!questions.length) return 'Добавьте хотя бы один вопрос';
    for (const question of questions) {
      if (!question.text.trim()) return 'Заполните текст каждого вопроса';
      if (question.options.some((option) => !option.text.trim())) return 'Заполните все варианты ответов';
      if (!question.options.some((option) => option.isCorrect)) return 'Отметьте правильный ответ';
    }
    return '';
  }

  async function save() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = { title, description, category, timeLimit, status, questions };
      if (id) await quizApi.update(id, body);
      else await quizApi.create(body);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const question = questions[selected];

  return <div className="form-page">
    <div className="page-head quiz-builder-head">
      <Logo />
      <h2>{id ? 'Редактирование' : 'Создание'} квиза</h2>
      <button className="btn primary" disabled={busy} onClick={save}>
        {busy ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </div>

    {error && <p className="form-error center">{error}</p>}

    <div className={`form-layout ${currentStep !== 1 ? 'without-question-settings' : ''}`}>
      <nav className="steps" aria-label="Шаги создания квиза">
        {steps.map((step, index) => <button
          type="button"
          key={step}
          className={`step ${currentStep === index ? 'active' : ''}`}
          onClick={() => { setCurrentStep(index); setError(''); }}
        >
          <span className="step-number">{index + 1}</span>
          <span>{step}</span>
        </button>)}
      </nav>

      <section className="editor">
        {currentStep === 0 && <>
          <h3>Основная информация</h3>
          <div className="field"><label>Название квиза</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Общие знания" /></div>
          <div className="field"><label>Описание</label><textarea className="input builder-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Коротко расскажите о квизе" /></div>
          <div className="field"><label>Категория</label><input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Общие знания" /></div>
          <button className="btn primary next-step" onClick={() => setCurrentStep(1)}>Далее: вопросы →</button>
        </>}

        {currentStep === 1 && <>
          <div className="builder-section-head"><div><h3>Вопросы</h3><p>{questions.length} вопросов в квизе</p></div><button className="btn primary" onClick={() => { setQuestions([...questions, blankQuestion()]); setSelected(questions.length); }}>＋ Добавить</button></div>
          {questions.map((item, index) => <div className={`question ${index === selected ? 'selected-question' : ''}`} onClick={() => setSelected(index)} key={index}>
            <div><b>{index + 1}. {item.text || 'Новый вопрос'}</b><p>{item.type === 'SINGLE' ? 'Одиночный' : 'Множественный'} выбор · {item.timeLimit} сек.</p></div>
            <button className="question-remove" type="button" title="Удалить вопрос" onClick={(event) => { event.stopPropagation(); removeQuestion(index); }}>×</button>
          </div>)}
          <button className="btn next-step" onClick={() => setCurrentStep(2)}>Далее: настройки →</button>
        </>}

        {currentStep === 2 && <>
          <h3>Настройки игры</h3>
          <div className="field"><label>Время на вопрос по умолчанию</label><input className="input" type="number" min="5" max="300" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} /></div>
          <div className="setting-note"><b>Баллы за скорость</b><p>Правильный ответ даёт минимум 50% баллов. Остальная часть зависит от скорости.</p></div>
          <div className="setting-note"><b>Порядок вопросов</b><p>Вопросы отображаются в том порядке, в котором находятся в списке.</p></div>
          <button className="btn primary next-step" onClick={() => setCurrentStep(3)}>Далее: публикация →</button>
        </>}

        {currentStep === 3 && <>
          <h3>Публикация</h3>
          <div className="publish-summary"><span>Название</span><b>{title || 'Не указано'}</b><span>Категория</span><b>{category || 'Не указана'}</b><span>Вопросов</span><b>{questions.length}</b></div>
          <div className="field"><label>Статус квиза</label><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="DRAFT">Сохранить как черновик</option><option value="PUBLISHED">Опубликовать</option></select></div>
          <button className="btn primary wide" disabled={busy} onClick={save}>{busy ? 'Сохраняем…' : id ? 'Сохранить изменения' : 'Создать квиз'}</button>
        </>}
      </section>

      {currentStep === 1 && question && <aside className="settings">
        <h4>Вопрос {selected + 1}</h4>
        <div className="field"><label>Текст вопроса</label><textarea className="input builder-textarea" value={question.text} onChange={(e) => updateQuestion('text', e.target.value)} /></div>
        <label className="options-label">Вид вопроса</label>
        <div className="question-kind-switch">
          <button type="button" className={question.imageUrl === null ? 'active' : ''} onClick={() => updateQuestion('imageUrl', null)}>▤ Текстовый</button>
          <button type="button" className={question.imageUrl !== null ? 'active' : ''} onClick={() => updateQuestion('imageUrl', question.imageUrl || '')}>▧ С изображением</button>
        </div>
        {question.imageUrl !== null && <div className="image-editor">
          {question.imageUrl && <img src={question.imageUrl} alt="Предпросмотр вопроса" />}
          <label className="image-upload">＋ Загрузить изображение<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => loadImage(e.target.files[0])} /></label>
          <div className="field"><label>или вставьте ссылку</label><input className="input" type="url" value={question.imageUrl?.startsWith('data:') ? '' : question.imageUrl || ''} onChange={(e) => updateQuestion('imageUrl', e.target.value)} placeholder="https://example.com/image.jpg" /></div>
          {question.imageUrl && <button type="button" className="remove-image" onClick={() => updateQuestion('imageUrl', '')}>Удалить изображение</button>}
        </div>}
        <div className="field"><label>Тип ответа</label><select className="input" value={question.type} onChange={(e) => changeAnswerType(e.target.value)}><option value="SINGLE">Одиночный выбор</option><option value="MULTIPLE">Множественный выбор</option></select></div>
        <div className="field"><label>Время, секунд</label><input className="input" type="number" min="5" max="300" value={question.timeLimit} onChange={(e) => updateQuestion('timeLimit', Number(e.target.value))} /></div>
        <div className="field"><label>Баллы</label><input className="input" type="number" min="1" max="10000" value={question.points} onChange={(e) => updateQuestion('points', Number(e.target.value))} /></div>
        <div className="options-heading"><label className="options-label">Варианты ответа ({question.options.length})</label><span>от 2 до 8</span></div>
        {question.options.map((option, index) => <div className="option-edit" key={index}>
          <input type={question.type === 'SINGLE' ? 'radio' : 'checkbox'} name="correct-option" checked={option.isCorrect} onChange={() => selectCorrect(index)} />
          <input className="input" value={option.text} onChange={(e) => updateOption(index, 'text', e.target.value)} placeholder={`Вариант ${index + 1}`} />
          <button type="button" className="remove-option" disabled={question.options.length <= 2} onClick={() => removeOption(index)} title="Удалить вариант">×</button>
        </div>)}
        <button type="button" className="add-option" disabled={question.options.length >= 8} onClick={addOption}>＋ Добавить вариант ответа</button>
        <p className="settings-hint">{question.type === 'SINGLE' ? 'Отметьте один правильный вариант.' : 'Отметьте все правильные варианты.'}</p>
      </aside>}
    </div>
  </div>;
}
