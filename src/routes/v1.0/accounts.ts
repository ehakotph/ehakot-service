import createBaseRouter from '../../utilities/base-router';
import Account from '../../models/public/account.model';
import validateResource from '@/middlewares/validate-resource';
import { createAccountSchema } from '@/schemas/auth.schema';

const accountRouter = createBaseRouter(Account, {
    middlewares: {
        create: [validateResource(createAccountSchema)]
    }
});

export default accountRouter;
