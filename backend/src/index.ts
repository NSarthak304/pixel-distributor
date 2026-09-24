/**
 * Pixel Distributor - Server Bootstrap
 */

import { app } from './app.js';

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  PIXEL DISTRIBUTOR - CENTRAL BACKEND RUNTIME`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
