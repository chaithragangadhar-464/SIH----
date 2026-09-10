require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const problemRoutes = require('./routes/problemRoutes');
const solutionRoutes = require('./routes/solutionRoutes');
const teamRoutes = require('./routes/teamRoutes');
const commentRoutes = require('./routes/commentRoutes');
const voteRoutes = require('./routes/voteRoutes');
const certificationRoutes = require('./routes/certificationRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const implementationRoutes = require('./routes/implementationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// 1. Connect to MongoDB
connectDB();

// 2. Configure CORS for local development and the deployed frontend origin.
const configuredFrontendOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([
    ...configuredFrontendOrigins,
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 3. JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Serve uploaded files statically (read-only access to evidence/certs/docs)
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// 5. Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Problem2Impact backend is running' });
});

// 6. Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/solutions', solutionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/implementations', implementationRoutes);
app.use('/api/notifications', notificationRoutes);

// 7. 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Problem2Impact backend listening on port ${PORT}`);
});

module.exports = app;
