import { Router } from 'express';
import { checkProximity, updateDriverLocation, getDriverLocations } from '../../controllers/location.controller';
import validateResource from '../../middlewares/validate-resource';
import { checkProximitySchema, updateDriverLocationSchema, getDriverLocationsSchema } from '../../schemas/location.schema';

const locationRouter = Router();

locationRouter.post('/check-proximity', validateResource(checkProximitySchema), checkProximity);
locationRouter.post('/update-driver-location', validateResource(updateDriverLocationSchema), updateDriverLocation);
locationRouter.post('/driver-locations', validateResource(getDriverLocationsSchema), getDriverLocations);

export default locationRouter;
