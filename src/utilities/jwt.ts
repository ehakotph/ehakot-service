import { env } from '@config/env';
import jwt from 'jsonwebtoken';

export function sign_jwt(
    object: object,
    options?: jwt.SignOptions | undefined,
) {
    const private_key = Buffer.from(env.PRIVATE_ACCESS_KEY, 'base64').toString('ascii');

    return jwt.sign({ ...object, iat: Math.floor(Date.now() / 1000) }, private_key, {
        ...(options && options),
        expiresIn: env.JWT_EXPIRES_IN,
        algorithm: 'RS256',
    });
}

export function verify_jwt(token: string) {
    try {
        const public_key = Buffer.from(env.PUBLIC_ACCESS_KEY, 'base64').toString('ascii');

        const decoded = jwt.verify(token, public_key, {
            algorithms: ['RS256'],
        });

        return { valid: true, expired: false, decoded };
    } catch (error: unknown) {
        const _error = error as Error;
        const is_jwt_error = _error instanceof jwt.JsonWebTokenError;
        const is_token_expired = is_jwt_error && _error.message === 'jwt expired';

        return {
            valid: false,
            expired: is_token_expired,
            decoded: null,
        };
    }
}
