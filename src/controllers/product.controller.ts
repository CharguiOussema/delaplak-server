import { Request, Response } from 'express';
import * as productService from '../services/product.service';
import { STATUS_CODE } from '../types/consts';
import { BadRequestError } from '../errors';
import { RequestWithBody, RequestWithParamsAndBody } from '../utils/express';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, DeleteProductImageDto } from '../types-server/product';
import { IdParamDto } from '../types-server/common/idParam.dto';

export async function create(req: RequestWithBody<CreateProductDto>, res: Response) {
  const product = await productService.create({ payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(product);
}

export async function getAll(req: Request, res: Response) {
  const result = await productService.getAll(req.query as unknown as ProductQueryDto);
  res.status(STATUS_CODE.OK).send(result);
}

export async function getById(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const product = await productService.getById(req.params.id);
  res.status(STATUS_CODE.OK).send(product);
}

export async function update(req: RequestWithParamsAndBody<IdParamDto, UpdateProductDto>, res: Response) {
  const product = await productService.update({ id: req.params.id, payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(product);
}

export async function remove(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  await productService.remove(req.params.id);
  res.status(STATUS_CODE.OK).send({ success: true });
}

export async function filter(_req: Request, res: Response) {
  const result = await productService.filter();
  res.status(STATUS_CODE.OK).send(result);
}

export async function addImages(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files.length) {
    throw new BadRequestError('No image files provided', 'product.controller.addImages');
  }
  const product = await productService.addImages({
    id: req.params.id,
    fileNames: files.map((f) => f.filename),
    currentUser: req.currentUser,
  });
  res.status(STATUS_CODE.OK).send(product);
}

export async function removeImage(req: RequestWithParamsAndBody<IdParamDto, DeleteProductImageDto>, res: Response) {
  const product = await productService.removeImage({ id: req.params.id, path: req.body.path, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(product);
}
