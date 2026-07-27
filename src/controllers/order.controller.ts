import { Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { STATUS_CODE } from '../types/consts';
import { RequestWithBody, RequestWithParamsAndBody } from '../utils/express';
import { OrderQueryDto } from '../types-server/order';
import { IdParamDto } from '../types-server/common/idParam.dto';

export async function create(req: RequestWithBody<Record<string, never>>, res: Response) {
  const order = await orderService.create({ currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(order);
}

export async function getAll(req: Request, res: Response) {
  const result = await orderService.getAll({ ...(req.query as unknown as OrderQueryDto), currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(result);
}

export async function getById(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const order = await orderService.getById({ id: req.params.id, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(order);
}

export async function confirm(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const result = await orderService.confirm({ id: req.params.id, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(result);
}
