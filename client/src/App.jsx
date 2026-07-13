import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JoinQuizPage from './pages/JoinQuizPage';
import DashboardPage from './pages/DashboardPage';
import CreateQuizPage from './pages/CreateQuizPage';
import EditQuizPage from './pages/EditQuizPage';
import LobbyPage from './pages/LobbyPage';
import HostGamePage from './pages/HostGamePage';
import PlayerGamePage from './pages/PlayerGamePage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import OrganizerHomePage from './pages/OrganizerHomePage';

export default function App(){return <Routes>
  <Route path="/" element={<HomePage/>}/><Route path="/login" element={<LoginPage/>}/>
  <Route path="/register" element={<RegisterPage/>}/><Route path="/join" element={<JoinQuizPage/>}/>
  <Route path="/dashboard" element={<OrganizerHomePage/>}/><Route path="/quizzes" element={<DashboardPage/>}/><Route path="/quiz/create" element={<CreateQuizPage/>}/>
  <Route path="/quiz/:id/edit" element={<EditQuizPage/>}/><Route path="/lobby" element={<LobbyPage/>}/>
  <Route path="/host" element={<HostGamePage/>}/><Route path="/play" element={<PlayerGamePage/>}/>
  <Route path="/results" element={<ResultsPage/>}/><Route path="/profile" element={<ProfilePage/>}/>
  <Route path="*" element={<Navigate to="/"/>}/>
</Routes>}
