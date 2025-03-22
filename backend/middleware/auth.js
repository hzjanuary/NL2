const db = require('../config/db'); // Đảm bảo đường dẫn đúng

const authenticateSession = (req, res, next) => {
    const sessionId = req.headers['x-session-id'];
    console.log('Session ID received:', sessionId); // Debug session ID
    if (!sessionId) {
        return res.status(401).json({ error: 'Session ID is required' });
    }

    db.query('SELECT * FROM sessions WHERE SessionID = ?', [sessionId], (err, results) => {
        if (err) {
            console.error('Error checking session:', err);
            return res.status(500).json({ error: 'Failed to authenticate session' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid session' });
        }
        req.session = results[0];
        next();
    });
};

module.exports = { authenticateSession }; // Đảm bảo export đúng