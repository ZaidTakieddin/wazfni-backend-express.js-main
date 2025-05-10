import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Handle graceful shutdown
const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0); // Use 0 for graceful exit
    });
  } else {
    process.exit(0);
  }
};

const unexpectedErrorHandler = (error: Error) => {
  console.error('Unhandled Error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', (reason: unknown) => {
  // We wrap the reason in an Error object if it's not already one
  throw reason instanceof Error
    ? reason
    : new Error(`Unhandled Rejection: ${reason}`);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  exitHandler();
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  exitHandler();
});
