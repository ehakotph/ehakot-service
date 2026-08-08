import zod from 'zod';

export const localAuthSchema = zod.object({
    body: zod
        .object({
            email: zod.email({ message: 'email is required' }),
            password: zod.string({ message: 'password is required' }),
        })
        .strict(),
});

export const createAccountSchema = zod.object({
    body: zod
        .object({
            name: zod.string({ message: 'name is required' }),
            email: zod.email({ message: 'email is required' }),
            password: zod.string({ message: 'password is required' }),
        })
        .strict(),
});
