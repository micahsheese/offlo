import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (placeholder)
app.get('/api/users', (req, res) => {
  res.json({ message: 'Users endpoint - TBD' });
});

app.post('/api/drafts', (req, res) => {
  res.json({ message: 'Create draft endpoint - TBD' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Offlo API running on port ${PORT}`);
});
