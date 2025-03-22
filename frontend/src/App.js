import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProjectList from './components/ProjectList';
import Login from './components/Login';
import TeamList from './components/TeamList';
import TimeLog from './components/TimeLog';
import Navigation from './components/Navigation'; // Import Navigation
import './App.css';

// Component con để xử lý logout với useNavigate
const LogoutButton = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
            console.log('Sending logout request to /auth/logout with sessionId:', sessionId);
            try {
                await axios.delete('http://localhost:5000/auth/logout', {
                    headers: { 'x-session-id': sessionId }
                });
                console.log('Logout successful');
            } catch (err) {
                console.error('Logout error:', err.response?.data || err.message);
            }
            localStorage.removeItem('sessionId');
        }
        onLogout();
        navigate('/login');
    };

    return (
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <p>Xin chào, {user.FullName}! <button onClick={handleLogout}>Đăng xuất</button></p>
        </div>
    );
};

// Component chính
function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
            console.log('Checking session on load at /auth/check-session with sessionId:', sessionId);
            axios.get('http://localhost:5000/auth/check-session', {
                headers: { 'x-session-id': sessionId }
            })
                .then(response => {
                    console.log('Session check response:', response.data);
                    setUser({ FullName: response.data.user.FullName });
                })
                .catch(err => {
                    console.error('Session check error on load:', err.response?.data || err.message);
                    localStorage.removeItem('sessionId');
                    setUser(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const ProtectedRoute = ({ children }) => {
        if (loading) {
            return <div>Loading...</div>;
        }
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        return children;
    };

    return (
        <Router>
            <div className="App">
                <h1 style={{ textAlign: 'center' }}>App Quản lý dự án</h1>
                {user && (
                    <>
                        <LogoutButton user={user} onLogout={() => setUser(null)} />
                        <Navigation />
                    </>
                )}
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route
                        path="/projects"
                        element={
                            <ProtectedRoute>
                                <ProjectList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teams"
                        element={
                            <ProtectedRoute>
                                <TeamList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/timelog"
                        element={
                            <ProtectedRoute>
                                <TimeLog />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to={user ? "/projects" : "/login"} replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;