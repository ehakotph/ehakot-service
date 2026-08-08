import createServer from './src/utilities/create-server';
import { env } from '@config/env';

const PORT = env.PORT;

async function startServer() {
    try {
        const app = await createServer();

        const server = app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

        // Graceful shutdown handling
        const gracefulShutdown = (signal: string) => {
            console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
            server.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });

            // Force shutdown after 10 seconds if connections remain open
            const forceTimeout = setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
            forceTimeout.unref(); // Allow process to exit naturally if all connections close
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    } catch (error: unknown) {
        console.error('Unable to start server, error:', error);
        process.exit(1);
    }
}

process.on('unhandledRejection', (reason: unknown) => {
    console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();