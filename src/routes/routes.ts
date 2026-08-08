import { type Express, type Request, type Response } from 'express';
import package_json from '../../package.json';
import v1Router from './v1.0/index';

function routes(app: Express) {
    // Root route
    app.get('/', (_req: Request, res: Response) => {
        res.status(200).json({
            app: 'Express + TypeScript Starter Template',
            version: package_json.version || '0.0.1',
        });
    });

    // Health check endpoint
    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
        });
    });

    // Versioned API routes
    app.use('/v1', v1Router);
}

export default routes;