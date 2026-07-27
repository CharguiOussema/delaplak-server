import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { userToResponseDTO } from '../helpers';
import { STATUS_CODE } from '../types/consts';
import { RequestWithBody, RequestWithParamsAndBody } from '../utils/express';
import { CreateUserDto, UpdateUserDto } from '../types-server/user';
import { IdParamDto } from '../types-server/common/idParam.dto';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';

export async function create(req: RequestWithBody<CreateUserDto>, res: Response) {
  const user = await userService.create({ payload: req.body });
  res.status(STATUS_CODE.OK).send(userToResponseDTO(user));
}

export async function getAll(req: Request, res: Response) {
  const result = await userService.getAll(req.query as unknown as PaginationQueryValidator);
  res.status(STATUS_CODE.OK).send({ ...result, docs: result.docs.map(userToResponseDTO) });
}

export async function getById(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const user = await userService.getById({ id: req.params.id });
  res.status(STATUS_CODE.OK).send(userToResponseDTO(user));
}

export async function update(req: RequestWithParamsAndBody<IdParamDto, UpdateUserDto>, res: Response) {
  const user = await userService.update({ id: req.params.id, payload: req.body });
  res.status(STATUS_CODE.OK).send(userToResponseDTO(user));
}

export async function deactivate(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const user = await userService.deactivate({ id: req.params.id });
  res.status(STATUS_CODE.OK).send(userToResponseDTO(user));
}
