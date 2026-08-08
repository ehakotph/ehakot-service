import { Router, type RequestHandler } from 'express';
import { Model, type ModelStatic } from 'sequelize';
import { create, readAll, readOne, update, destroy } from '@/utilities/base-controller';

/**
 * Supported CRUD route keys for this base router.
 */
type RouteKey = 'create' | 'readAll' | 'readOne' | 'update' | 'delete';

/**
 * Map of route keys → Express handler function.
 */
type Controllers = Record<RouteKey, RequestHandler>;

/**
 * Map of route keys → array of middlewares (executed before controller).
 */
type MiddlewareMap = Record<RouteKey, RequestHandler[]>;

/**
 * Map of route keys → whether the route is disabled.
 * Example: { delete: true } disables DELETE /:id
 */
type Disabled = Partial<Record<RouteKey, boolean>>;

/**
 * Config object for customizing the base router.
 */
interface RouterOptions {
    controllers?: Partial<Controllers>; // override default handlers
    middlewares?: Partial<MiddlewareMap>; // add per-route middlewares
    disabled?: Disabled; // selectively disable routes
}

/**
 * Route definitions: which HTTP method + path each key corresponds to.
 * `satisfies` ensures every RouteKey is covered exhaustively.
 */
const ROUTES = {
    create: { method: 'post', path: '/' },
    readAll: { method: 'get', path: '/' },
    readOne: { method: 'get', path: '/:id' },
    update: { method: 'put', path: '/:id' },
    delete: { method: 'delete', path: '/:id' },
} satisfies Record<RouteKey, { method: 'get' | 'post' | 'put' | 'delete'; path: string }>;

/**
 * Factory: builds a CRUD router for a given Sequelize model.
 *
 * Features:
 * - Default controllers (create, readAll, readOne, update, delete)
 * - Optional overrides for controllers and middlewares
 * - Ability to disable specific routes
 *
 * Example usage:
 *   const userRouter = createBaseRouter(UserModel, {
 *     disabled: { delete: true }, // disables DELETE /:id
 *     middlewares: { create: [authMiddleware] } // protect POST /
 *   });
 */
export default function createBaseRouter(model: ModelStatic<Model>, opts: Readonly<RouterOptions> = {}) {
    const router = Router();

    // Default controllers wired to Sequelize model
    const controllers: Controllers = {
        create: create(model),
        readAll: readAll(model),
        readOne: readOne(model),
        update: update(model),
        delete: destroy(model),
        ...(opts.controllers ?? {}), // override if provided
    };

    // Default empty middleware arrays (per route)
    const middlewares: MiddlewareMap = {
        create: [],
        readAll: [],
        readOne: [],
        update: [],
        delete: [],
        ...(opts.middlewares ?? {}),
    };

    // All routes enabled by default
    const disabled: Readonly<Record<RouteKey, boolean>> = {
        create: false,
        readAll: false,
        readOne: false,
        update: false,
        delete: false,
        ...(opts.disabled ?? {}),
    };

    // Register only the enabled routes
    (Object.keys(ROUTES) as RouteKey[]).forEach((key) => {
        if (!disabled[key]) {
            const { method, path } = ROUTES[key];
            router[method](path, middlewares[key], controllers[key]);
        }
    });

    return router;
}

export type { Controllers, MiddlewareMap, Disabled, RouterOptions };
