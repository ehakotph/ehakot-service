import createBaseRouter from '../../utilities/base-router';
import Notification from '@/models/public/notification.model';

const notificationRouter = createBaseRouter(Notification, {
});

export default notificationRouter;
