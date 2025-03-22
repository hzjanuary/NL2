const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./config/db');

// Import routes
const apiRoutes = require('./routes/api');
const loginRoutes = require('./routes/login');

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Cho phép yêu cầu từ frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-session-id']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sử dụng routes
app.use('/api', loginRoutes); // Sử dụng loginRoutes cho /api/login
app.use('/api', apiRoutes); // Các route khác
app.use('/auth', loginRoutes); // Sử dụng loginRoutes cho /auth/check-session và /auth/logout

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});