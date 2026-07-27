import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import { STATUS_CODE } from '../types/consts';
import { RequestWithBody, RequestWithParamsAndBody } from '../utils/express';
import { CreateCategoryDto, UpdateCategoryDto } from '../types-server/category';
import { IdParamDto } from '../types-server/common/idParam.dto';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';

export async function create(req: RequestWithBody<CreateCategoryDto>, res: Response) {
  const category = await categoryService.create({ payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(category);
}

// Typed as the plain Express `Request` (not RequestWithQuery<T>) because Express's own
// RequestHandler overload resolution requires req.query to remain assignable from the
// default `ParsedQs` shape at route-registration time; the DTO shape is enforced at
// runtime by ValidatorMiddleware.validateQuery earlier in the chain, so it's safe to cast here.
export async function getAll(req: Request, res: Response) {
  const result = await categoryService.getAll(req.query as unknown as PaginationQueryValidator);
  res.status(STATUS_CODE.OK).send(result);
}

export async function getById(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const category = await categoryService.getById(req.params.id);
  res.status(STATUS_CODE.OK).send(category);
}

export async function update(req: RequestWithParamsAndBody<IdParamDto, UpdateCategoryDto>, res: Response) {
  const category = await categoryService.update({ id: req.params.id, payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(category);
}

export async function remove(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  await categoryService.remove(req.params.id);
  res.status(STATUS_CODE.OK).send({ success: true });
}

export async function filter(_req: Request, res: Response) {
  const result = await categoryService.filter();
  res.status(STATUS_CODE.OK).send(result);
}

export async function tree(_req: Request, res: Response) {
  const result = await categoryService.tree();
  res.status(STATUS_CODE.OK).send(result);
}
