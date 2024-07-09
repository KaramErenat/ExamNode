
const express = require('express');
const connectDB = require('./config/db');
const authMiddleware = require('./middlewares/authMiddleware');
const { generateToken, hashPassword, comparePasswords } = require('./controllers/authController');

require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

app.use(express.json()); 



// Routes
const userRoutes = require('./routes/userRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/companies', authMiddleware, companyRoutes);
app.use('/api/jobs', jobRoutes);

// Error handling middleware (must be last middleware)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
