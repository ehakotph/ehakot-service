import createBaseRouter from '../../utilities/base-router';
import Account from '../../models/public/account.model';
import { populateLocationDetails } from '@/middlewares/populate-location';
// import validateResource from '@/middlewares/validate-resource';
// import { createAccountSchema } from '@/schemas/auth.schema';

const accountRouter = createBaseRouter(Account, {
    middlewares: {
        create: [populateLocationDetails],
        update: [populateLocationDetails]
    }
});

export default accountRouter;
