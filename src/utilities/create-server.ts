import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { testDatabaseConnection } from './database';
import { initializePassport } from '../strategies';
import { testTransporter } from './nodemailer';
import rateLimit from 'express-rate-limit';
import routes from '../routes/routes';
import compression from 'compression';
import { env } from '@config/env';
import passport from 'passport';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

async function createServer(): Promise<Express> {
    const nodeEnv = env.NODE_ENV;
    console.info(`${nodeEnv} environment`.toUpperCase());

    const app: Express = express();

    // Trust proxy (necessary when behind reverse proxies like Nginx/Cloudflare)
    app.set('trust proxy', 1);

    // Security middlewares
    app.use(
        cors({
            origin: true,
            credentials: true,
        })
    );
    app.use(helmet({
        contentSecurityPolicy: false, // Not needed for JSON APIs
    }));

    // Rate limiting — protect against brute-force and abuse
    app.use(rateLimit({
        windowMs: 10 * 60 * 1000, // 10 minutes
        limit: 200,               // Limit each IP to 200 requests per window
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            success: false,
            error: { message: 'Too many requests, please try again later.' },
        },
    }));

    // Request parsing
    app.use(express.json({ limit: '12kb' }));
    app.use(express.urlencoded({ extended: false }));

    // Compression & logging
    app.use(compression());
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // Initialize Passport
    initializePassport();
    app.use(passport.initialize());

    // Initialize routes
    routes(app);

    await Promise.all([
        testDatabaseConnection(),
        testTransporter()
    ])

    // 404 Catch-all handler
    app.use((_req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: {
                message: 'Route not found',
            },
        });
    });

    // Global Error Handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error('Unhandled Server Error:', err);
        res.status(500).json({
            success: false,
            error: {
                message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
            },
        });
    });

    // If you want to enable sockets
    // const server = await initializeSocket(app);

    return app;
}

export default createServer;