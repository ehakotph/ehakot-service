import createBaseRouter from '../../utilities/base-router';
import GarbageReport from '../../models/public/garbage-report.model';
import { populateLocationDetails } from '../../middlewares/populate-location';
import { getHeatmapReport } from '@/controllers/garbage-report.controller';

const garbageReportRouter = createBaseRouter(GarbageReport, {
    middlewares: {
        create: [populateLocationDetails],
        update: [populateLocationDetails],
    }
});

garbageReportRouter.get('/heatmap/report', getHeatmapReport);

export default garbageReportRouter;
