const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Route đăng nhập
router.post('/login', async (req, res) => {
    const { Email, Password } = req.body;
    console.log('Login request received:', { Email, Password });

    if (!Email || !Password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const [rows] = await db.promise().query('SELECT * FROM user WHERE Email = ?', [Email]);
        console.log('User found:', rows);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = rows[0];
        if (user.Password !== Password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Tạo session mới
        const sessionId = uuidv4();
        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1000); // Hết hạn sau 1 giờ

        await db.promise().query(
            'INSERT INTO sessions (SessionID, UserID, CreatedAt, ExpiresAt) VALUES (?, ?, ?, ?)',
            [sessionId, user.UserID, createdAt, expiresAt]
        );

        console.log('Session created:', { sessionId, userId: user.UserID });
        res.json({ message: 'Login successful', sessionId, user: { FullName: user.FullName } });
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Route kiểm tra session
router.get('/check-session', async (req, res) => {
    const sessionId = req.headers['x-session-id'];
    console.log('Checking session with ID:', sessionId);

    if (!sessionId) {
        return res.status(401).json({ error: 'No session ID provided' });
    }

    try {
        const [rows] = await db.promise().query(
            'SELECT s.*, u.FullName FROM sessions s JOIN user u ON s.UserID = u.UserID WHERE s.SessionID = ? AND s.ExpiresAt > NOW()',
            [sessionId]
        );
        console.log('Session check result:', rows);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        res.json({ message: 'Session valid', user: { FullName: rows[0].FullName } });
    } catch (error) {
        console.error('Error checking session:', error.message);
        res.status(500).json({ error: 'Failed to check session' });
    }
});

// Route đăng xuất
router.delete('/logout', async (req, res) => {
    const sessionId = req.headers['x-session-id'];
    console.log('Logout attempt:', sessionId);

    if (!sessionId) {
        return res.status(400).json({ error: 'No session ID provided' });
    }

    try {
        const [result] = await db.promise().query('DELETE FROM sessions WHERE SessionID = ?', [sessionId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        console.log('Session deleted:', sessionId);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error during logout:', error.message);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

module.exports = router;