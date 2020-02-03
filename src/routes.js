import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';

// middlewares
import authMiddleware from './app/middlewares/auth';
import providerMiddleware from './app/middlewares/provider';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/session', SessionController.store);

/**
 * middleware só será válido para todas as rotas que estiverem
 * abaixo dessa chamada */

routes.use(authMiddleware);

// users
routes.put('/users', UserController.update);

// files
routes.post('/files', upload.single('file'), FileController.store);

// providers
routes.get('/providers', ProviderController.index);

// appointments
routes.get('/appointments', AppointmentController.index);
routes.post('/appointments', AppointmentController.store);
routes.delete('/appointments/:id', AppointmentController.delete);

// schedule
routes.get('/schedules', ScheduleController.index);

// notifications
routes.get('/notifications', providerMiddleware, NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

export default routes;
