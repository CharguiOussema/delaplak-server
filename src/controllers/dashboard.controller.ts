import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { STATUS_CODE } from '../types/consts';

export async function getStats(_req: Request, res: Response) {
  const stats = await dashboardService.getStats();
  res.status(STATUS_CODE.OK).send(stats);
}
