import express from 'express';
import cors from 'cors';
import siteRoutes from './routes/siteRoutes.js';
import serverConfig from './config/serverConfig.js';
import { errorHandler } from './utils/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/preview', express.static(serverConfig.GENERATED_SITES_DIR));

app.use('/api', siteRoutes);

app.use(errorHandler);

app.listen(serverConfig.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${serverConfig.PORT}`);
});