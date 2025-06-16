import express from 'express';
import cors from 'cors';
import siteRoutes from './routes/siteRoutes.js';
import serverConfig from './config/serverConfig.js';
import { errorHandler } from './utils/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for preview
app.use('/preview', express.static(serverConfig.GENERATED_SITES_DIR));

// Routes
app.use('/api', siteRoutes);

// Error handling
app.use(errorHandler);

app.listen(serverConfig.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${serverConfig.PORT}`);
});