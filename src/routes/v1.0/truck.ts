import createBaseRouter from '../../utilities/base-router';
import Truck from '@/models/public/truck.model';

const truckRouter = createBaseRouter(Truck, {
});

export default truckRouter;
