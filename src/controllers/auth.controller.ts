import { type Request, type Response } from 'express';
import Account from '../models/public/account.model';
import { sign_jwt } from '../utilities/jwt';
import City from '@/models/public/city.model';

export const authController = {
    async register(req: Request, res: Response) {
        try {
            const { email, birthdate } = req.body;

            const existingAccount = await Account.findOne({ where: { email } });
            
            if (existingAccount) {
                return res.status(409).json({ message: 'An account with this email already exists' });
            }

            const account = await Account.create({
                email,
                birthdate: new Date(birthdate),
            });

            const token = sign_jwt({ id: account.id, email: account.email });

            return res.status(201).json({
                message: 'Account created successfully',
                token,
                user: {
                    id: account.id,
                    name: account.name,
                    birthdate: account.birthdate,
                    email: account.email,
                    role: account.role,
                    city_id: account.city_id,
                    location_barangay: account.location_barangay,
                    location_city: account.location_city,
                    contact_number: account.contact_number,
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

        const city = account.city_id ? await City.findOne({ where: {id: account.city_id} }) : null
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: account.id,
                name: account.name,
                email: account.email,
                role: account.role,
                city_id: account.city_id,
                location_barangay: account.location_barangay,
                location_city: account.location_city,
                contact_number: account.contact_number,
                birthdate: account.birthdate,
                city
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

    async birthdateLogin(req: Request, res: Response) {
        try {
            const { email, birthdate } = req.body;

            const account = await Account.findOne({ where: { email } });

            if (!account) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            if (!account.birthdate) {
                return res.status(401).json({ message: 'Invalid credentials or birthdate not set' });
            }

            const accountBirthdate = new Date(account.birthdate).toISOString().split('T')[0];
            const inputBirthdate = new Date(birthdate).toISOString().split('T')[0];

            if (accountBirthdate !== inputBirthdate) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = sign_jwt({ id: account.id, email: account.email });

            return res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: account.id,
                    name: account.name,
                    email: account.email,
                    role: account.role,
                    city_id: account.city_id,
                    location_barangay: account.location_barangay,
                    location_city: account.location_city,
                    contact_number: account.contact_number,
                    birthdate: account.birthdate
                }
            });
        } catch (error) {
            console.error('Email/Birthday login error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
};
