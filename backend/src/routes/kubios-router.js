import express from 'express';
import { authenticateToken } from '../middlewares/authentication.js';
import { getUserData, getUserInfo, getUserDataByDate, saveHrvData } from '../controllers/kubios-controller.js';

const kubiosRouter = express.Router();

kubiosRouter.get('/user-data', authenticateToken, getUserData);

kubiosRouter.get('/user-info', authenticateToken, getUserInfo);

kubiosRouter.get('/user-data/:date', authenticateToken, getUserDataByDate);

kubiosRouter.post('/user-data/:date', authenticateToken, saveHrvData);

export default kubiosRouter;
