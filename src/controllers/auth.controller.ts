import { type Request, type Response } from 'express';
import Account from '../models/public/account.model';
import { sign_jwt } from '../utilities/jwt';

export const authController = {
    async register(req: Request, res: Response) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ message: 'Name, email, and password are required' });
            }

            const existingAccount = await Account.findOne({ where: { email } });
            
            if (existingAccount) {
                return res.status(409).json({ message: 'An account with this email already exists' });
            }

            const account = await Account.create({
                name,
                email,
                password,
                role: 'user',
            });

            const token = sign_jwt({ id: account.id, email: account.email });

            return res.status(201).json({
                message: 'Account created successfully',
                token,
                user: {
                    id: account.id,
                    name: account.name,
                    email: account.email,
                    role: account.role,
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },

    async login(req: Request, res: Response) {
        // req.user is populated by the local strategy
        const account = req.user as Account;

        const token = sign_jwt({ id: account.id, email: account.email });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: account.id,
                name: account.name,
                email: account.email,
                role: account.role,
            }
        });
    },

    async me(req: Request, res: Response) {
        // req.user is populated by the jwt strategy
        const account = req.user as Account;

        return res.status(200).json({
            user: {
                id: account.id,
                name: account.name,
                email: account.email,
                role: account.role,
            }
        });
    },
};
