import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    // Tự động ẩn thông báo sau 3 giây
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000); // Ẩn sau 3 giây
            return () => clearTimeout(timer); // Dọn dẹp timer khi component unmount
        }
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, errorMessage]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/login', {
                Email: email,
                Password: password
            });
            console.log('Login response:', response.data);

            const { sessionId, user } = response.data;
            localStorage.setItem('sessionId', sessionId);
            setSuccessMessage('Login successful');
            setErrorMessage('');

            onLogin(user);
            navigate('/projects'); // Chuyển hướng đến /projects thay vì /teams
        } catch (error) {
            console.error('Error during login:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            setErrorMessage('Login failed: ' + errorMsg);
            setSuccessMessage('');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;