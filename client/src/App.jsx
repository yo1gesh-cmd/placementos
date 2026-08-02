import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import JDAnalyzer from './pages/JDAnalyzer';
import JDResult from './pages/JDResult';
import ResumeGenerate from './pages/ResumeGenerate';
import PrepTracker from './pages/PrepTracker';
import Profile from './pages/Profile';
import VoiceInterview from './pages/VoiceInterview';
function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/jd-analyzer" element={<ProtectedRoute><JDAnalyzer /></ProtectedRoute>} />
      <Route path="/jd-analyzer/:jdId" element={<ProtectedRoute><JDResult /></ProtectedRoute>} />
      <Route path="/resume/:jdId" element={<ProtectedRoute><ResumeGenerate /></ProtectedRoute>} />
      <Route path="/prep-tracker" element={<ProtectedRoute><PrepTracker /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/voice-interview" element={<VoiceInterview />} />
    </Routes>
  );
}

export default App;