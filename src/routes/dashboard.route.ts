import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import AccessTokenValidator from '../services/accessTokenValidator.service';
import { validateToken } from '../services/token.service';
import { USER_ROLES } from '../types/consts';

const dashboardRouter = Router();

dashboardRouter.get('/stats', validateToken, AccessTokenValidator.hasRole([USER_ROLES.ADMIN]), dashboardController.getStats);

export default dashboardRouter;
