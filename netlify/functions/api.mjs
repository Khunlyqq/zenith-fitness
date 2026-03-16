import serverless from 'serverless-http';
import { createApp, initDatabase } from '../../server/index.js';

let isDbReady = false;

const app = createApp();

export const handler = async (event, context) => {
  if (!isDbReady) {
    await initDatabase();
    isDbReady = true;
  }
  
  // Rewrite the path: Netlify sends /.netlify/functions/api/xxx
  // We need to strip the prefix so Express sees /api/xxx
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '') || '/';
  }
  
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};
