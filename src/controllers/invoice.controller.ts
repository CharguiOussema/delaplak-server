import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import * as invoiceService from '../services/invoice.service';
import { STATUS_CODE } from '../types/consts';
import { NotFoundError } from '../errors';
import { ENV } from '../config';
import { RequestWithParamsAndBody } from '../utils/express';
import { PaginationQueryValidator } from '../middlewares/validators/QueryValidator';
import { IdParamDto } from '../types-server/common/idParam.dto';

export async function getAll(req: Request, res: Response) {
  const result = await invoiceService.getAll({ ...(req.query as unknown as PaginationQueryValidator), currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(result);
}

export async function getById(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const invoice = await invoiceService.getById({ id: req.params.id, currentUser: req.currentUser });
  res.status(STATUS_CODE.OK).send(invoice);
}

export async function downloadPdf(req: RequestWithParamsAndBody<IdParamDto, Record<string, never>>, res: Response) {
  const invoice = await invoiceService.getById({ id: req.params.id, currentUser: req.currentUser });

  const absolutePath = path.join(process.cwd(), ENV.UPLOAD_DIR, 'invoices', path.basename(invoice.pdfPath));
  if (!fs.existsSync(absolutePath)) {
    throw new NotFoundError('Invoice PDF file not found on disk', 'invoice.controller.downloadPdf');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`);
  fs.createReadStream(absolutePath).pipe(res);
}
