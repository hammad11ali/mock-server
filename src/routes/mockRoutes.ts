import { Application, Router } from 'express';
import MockController from '../controllers/mockController';

const router = Router();
const mockController = new MockController();

router.get('/mock-data', mockController.getMockData.bind(mockController));

export const setMockRoutes = (app: Application) => {
    app.use('/api', router);
};