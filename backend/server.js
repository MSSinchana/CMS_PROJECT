import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { ensureSchema } from './db/ensureSchema.js';
import authRoutes from './routes/auth.routes.js';
import activityLogRoutes from './routes/activityLog.routes.js';
import blogsRoutes from './routes/blogs.routes.js';
import contentRoutes from './routes/content.routes.js';
import usersRoutes from './routes/users.routes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: frontendOrigin,
    credentials: false
  })
);
app.use(express.json({ limit: '25mb' }));

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'CMS backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/activity', activityLogRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({ success: false, message: 'Internal server error' });
});

async function startServer() {
  try {
    await ensureSchema();

    app.listen(port, () => {
      console.log(`CMS backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize backend startup tasks:', error);
    process.exit(1);
  }
}

startServer();
