import { Request, Response } from 'express';
import * as siteSettingsService from '../services/siteSettings.service';
import { STATUS_CODE } from '../types/consts';
import { BadRequestError } from '../errors';
import { RequestWithBody, RequestWithParamsAndBody } from '../utils/express';
import { UpdateSiteSettingsDto, StrengthItemDto, DecorItemDto, ItemIdParamDto } from '../types-server/siteSettings';

export async function getPublic(_req: Request, res: Response) {
  const settings = await siteSettingsService.getPublic();
  res.status(STATUS_CODE.OK).send(settings);
}

export async function update(req: RequestWithBody<UpdateSiteSettingsDto>, res: Response) {
  const settings = await siteSettingsService.update({ payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function addStrength(req: RequestWithBody<StrengthItemDto>, res: Response) {
  const settings = await siteSettingsService.addStrength({ payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function updateStrength(req: RequestWithParamsAndBody<ItemIdParamDto, StrengthItemDto>, res: Response) {
  const settings = await siteSettingsService.updateStrength({
    itemId: req.params.itemId,
    payload: req.body,
    currentUser: req.currentUser,
  });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function removeStrength(req: RequestWithParamsAndBody<ItemIdParamDto, Record<string, never>>, res: Response) {
  const settings = await siteSettingsService.removeStrength({ itemId: req.params.itemId, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function addDecor(req: RequestWithBody<DecorItemDto>, res: Response) {
  const settings = await siteSettingsService.addDecor({ payload: req.body, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function updateDecor(req: RequestWithParamsAndBody<ItemIdParamDto, DecorItemDto>, res: Response) {
  const settings = await siteSettingsService.updateDecor({
    itemId: req.params.itemId,
    payload: req.body,
    currentUser: req.currentUser,
  });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function removeDecor(req: RequestWithParamsAndBody<ItemIdParamDto, Record<string, never>>, res: Response) {
  const settings = await siteSettingsService.removeDecor({ itemId: req.params.itemId, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function setHeroMainImage(req: RequestWithParamsAndBody<Record<string, never>, Record<string, never>>, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    throw new BadRequestError('No image file provided', 'siteSettings.controller.setHeroMainImage');
  }
  const settings = await siteSettingsService.setHeroImage({ slot: 'main', fileName: file.filename, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function setHeroAccentImage(req: RequestWithParamsAndBody<Record<string, never>, Record<string, never>>, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    throw new BadRequestError('No image file provided', 'siteSettings.controller.setHeroAccentImage');
  }
  const settings = await siteSettingsService.setHeroImage({ slot: 'accent', fileName: file.filename, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(settings);
}

export async function setDecorImage(req: RequestWithParamsAndBody<ItemIdParamDto, Record<string, never>>, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    throw new BadRequestError('No image file provided', 'siteSettings.controller.setDecorImage');
  }
  const settings = await siteSettingsService.setDecorImage({
    itemId: req.params.itemId,
    fileName: file.filename,
    currentUser: req.currentUser,
  });
  res.status(STATUS_CODE.OK).send(settings);
}
