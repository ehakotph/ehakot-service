import type { NextFunction, Request, Response } from 'express';
import { type ZodType, ZodError } from 'zod';

const validateResource = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        next();
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            res.status(400).send({
                message: "There's something wrong with your request payload.",
                errors: error.issues,
            });
            return;
        }

        res.status(500).send({ message: 'Internal Server Error' });
    }
};

export default validateResource;
