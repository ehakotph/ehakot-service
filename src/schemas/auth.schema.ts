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
            email: zod.email({ message: 'email is required' }),
            birthdate: zod.string({ message: 'birthdate is required (YYYY-MM-DD)' }),
        })
        .strict(),
});

export const birthdateLoginSchema = zod.object({
    body: zod
        .object({
            email: zod.email({ message: 'Valid email is required' }),
            birthdate: zod.string({ message: 'birthdate is required (YYYY-MM-DD)' }),
        })
        .strict(),
});
