import { Request, Response } from 'express';
import * as productAttributeService from '../services/productAttribute.service';
import { STATUS_CODE } from '../types/consts';
import { RequestWithBody, RequestWithParamsAndBody } from '../utils/express';
import { CreateProductAttributeDto, UpdateProductAttributeDto, AttributeOptionDto } from '../types-server/productAttribute';
import { IdParamDto } from '../types-server/common/idParam.dto';
import { OptionIdParamDto } from '../types-server/productAttribute';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';

export async function create(req: RequestWithBody<CreateProductAttributeDto>, res: Response) {
  const attribute = await productAttributeService.create({ payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(attribute);
}

export async function getAll(req: Request, res: Response) {
  const result = await productAttributeService.getAll(req.query as unknown as PaginationQueryValidator);
  res.status(STATUS_CODE.OK).send(result);
}

export async function getById(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const attribute = await productAttributeService.getById(req.params.id);
  res.status(STATUS_CODE.OK).send(attribute);
}

export async function update(req: RequestWithParamsAndBody<IdParamDto, UpdateProductAttributeDto>, res: Response) {
  const attribute = await productAttributeService.update({ id: req.params.id, payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(attribute);
}

export async function remove(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  await productAttributeService.remove(req.params.id);
  res.status(STATUS_CODE.OK).send({ success: true });
}

export async function filter(_req: Request, res: Response) {
  const result = await productAttributeService.filter();
  res.status(STATUS_CODE.OK).send(result);
}

export async function addOption(req: RequestWithParamsAndBody<IdParamDto, AttributeOptionDto>, res: Response) {
  const attribute = await productAttributeService.addOption({ id: req.params.id, payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(attribute);
}

export async function updateOption(req: RequestWithParamsAndBody<OptionIdParamDto, AttributeOptionDto>, res: Response) {
  const attribute = await productAttributeService.updateOption({
    id: req.params.id,
    optionId: req.params.optionId,
    payload: req.body,
    currentUser: req.currentUser,
  });
  res.status(STATUS_CODE.OK).send(attribute);
}

export async function removeOption(req: RequestWithParamsAndBody<OptionIdParamDto, Record<string, never>>, res: Response) {
  const attribute = await productAttributeService.removeOption({
    id: req.params.id,
    optionId: req.params.optionId,
    currentUser: req.currentUser,
  });
  res.status(STATUS_CODE.OK).send(attribute);
}
