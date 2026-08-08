import createServer from '../src/utilities/create-server';
import type { Request, Response, Express } from 'express';

let app: Express;

export default async function handler(req: Request, res: Response) {
    if (!app) {
        app = await createServer();
    }
    return app(req, res);
}
