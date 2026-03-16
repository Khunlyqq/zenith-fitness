import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Workout = lazy(() => import('./pages/Workout'));
const Jadwal = lazy(() => import('./pages/Jadwal'));
const Statistik = lazy(() => import('./pages/Statistik'));
const Exercise = lazy(() => import('./pages/Exercise'));
const Profile = lazy(() => import('./pages/Profile'));

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-background-dark text-slate-500 text-sm">
    Loading...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/jadwal" element={<Layout><Jadwal /></Layout>} />
              <Route path="/statistik" element={<Layout><Statistik /></Layout>} />
              <Route path="/exercise" element={<Layout><Exercise /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
            </Routes>
          </Suspense>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
