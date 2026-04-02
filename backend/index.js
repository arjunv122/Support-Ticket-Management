require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./Database/connection');
const authRouter = require('./Routers/authRouter');
const ticketRouter = require('./Routers/ticketRouter');
const organizationRouter = require('./Routers/organizationRouter');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/organizations', organizationRouter);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Support Ticket Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
