import express from 'express';
import path from 'path';
import { apiRouter } from './src/server/api.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRouter);

// Serve static assets from built Vite application
app.use(express.static(path.resolve('dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve('dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`YUNAY Full-Stack Server listening on port ${PORT}`);
});
