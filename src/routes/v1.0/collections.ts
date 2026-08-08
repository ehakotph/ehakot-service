import createBaseRouter from '../../utilities/base-router';
import Collection from '../../models/public/collection.model';
import { createCollection, getCollectionsByLocation } from '../../controllers/collection.controller';

const collectionRouter = createBaseRouter(Collection, {
    controllers: {
        create: createCollection,
    },
});

collectionRouter.post('/search/location', getCollectionsByLocation);

export default collectionRouter;
