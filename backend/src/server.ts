import { createApp } from './app.js';
import { env } from './config/env.js';
import { initializeData } from './data/init.js';

async function startServer() {
  try {
    console.log('Starting Airline Resolution Agent Backend...');

    // Initialize data layer from seed data
    console.log('Initializing data layer...');
    await initializeData();
    console.log('✓ Data layer ready');

    // Create Express app
    const app = createApp();
    console.log('✓ Express app created');

    // Start listening
    app.listen(env.port, () => {
      console.log(`✓ Server running on http://localhost:${env.port}`);
      console.log(`✓ Environment: ${env.nodeEnv}`);
      console.log(`✓ Frontend URL: ${env.frontendUrl}`);
      console.log(`✓ Data directory: ${env.dataDir}`);
      console.log('');
      console.log('Endpoints:');
      console.log(`  GET  / - Service info`);
      console.log(`  GET  /health - Health check`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
