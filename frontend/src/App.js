import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- Page Components ---
import HomePage from './pages/HomePage';
import Getstart from './pages/Getstart';
import ProfileComplete from './pages/ProfileComplete';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Profile from './pages/profile';
import QuizPerformancePage from './pages/QuizPerformancePage';
import ProjectsPage from './pages/ProjectsPage';
import AiWebsiteCreator from './pages/AiWebsiteCreator'; // ADDED THIS
import LearningPage from './pages/LearningPage';
import CourseLevels from './pages/CourseLevels';
import SecureChat from './pages/SecureChat';
import VoiceAgentConfig from './pages/VoiceAgentConfig';
import EvaluationPage from './pages/EvaluationPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/get-started" element={<Getstart />} />

       <Route element={<ProtectedRoute />}>
  <Route path="/chat" element={<ChatPage />} />
  <Route path="/profile-complete" element={<ProfileComplete />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/quiz-performance" element={<QuizPerformancePage />} />
  <Route path="/projects" element={<ProjectsPage />} />
  <Route path="/secure-chat" element={<SecureChat />} />
  <Route path="/learn" element={<CourseLevels />} />
  <Route path="/learn/:language/:levelId" element={<LearningPage />} />
  <Route path="/ai-create" element={<AiWebsiteCreator />} />
   <Route path="/voice-agent" element={<VoiceAgentConfig />} />
   <Route path="/admin/evaluation" element={<EvaluationPage />} />
</Route>


        <Route path="*" element={<h1>404: Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;