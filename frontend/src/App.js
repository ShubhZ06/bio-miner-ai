import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';

// Lazy load the Dashboard to optimize initial bundle size
const Dashboard = lazy(() => import('./components/Dashboard'));

// Simple Loading Spinner Component
const LoadingSpinner = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0f172a',
        color: '#0ea5e9'
    }}>
        <div className="spinner">Loading Application...</div>
        <style>{`
      .spinner {
        font-size: 1.2rem;
        font-weight: 600;
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
    `}</style>
    </div>
);

function App() {
    return (
        <Router>
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/app" element={<Dashboard />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
