import express from 'express';
import { authenticateToken } from '../middlewares/authentication.js';
import { getUserData, getUserInfo, getUserDataByDate } from '../controllers/kubios-controller.js';

const kubiosRouter = express.Router();

kubiosRouter
  .get('/user-data', authenticateToken, getUserData)
  .get('/user-info', authenticateToken, getUserInfo)
  .get('/user-data/:date', authenticateToken, getUserDataByDate)

export default kubiosRouter;
