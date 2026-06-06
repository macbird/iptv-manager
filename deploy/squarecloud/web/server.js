import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;
const DIST_PATH = path.join(__dirname, 'dist');

// Middleware to set cache headers
app.use((req, res, next) => {
  if (req.url === '/' || req.url === '/index.html' || !req.url.includes('.')) {
    // Force no-cache for index.html and routes
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // Long cache for hashed assets (js, css, images)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// Serve static files from dist
app.use(express.static(DIST_PATH));

// SPA Fallback: All routes go to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving SPA from: ${DIST_PATH}`);
});
