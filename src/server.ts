// Imported here (not only from main.ts) so that createExpressServer() is self-contained —
// tests import this module directly via supertest without going through main.ts's bootstrap,
// and without this patch async errors thrown in route handlers/middleware would never reach
// the error-handling middleware below (the request would just hang).
import 'express-async-errors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request } from 'express';
import path from 'path';
import morgan from 'morgan';
import { ENV, isInDevelopmentMode, isInProductionMode } from './config';
import { LEVELS, STATUS_CODE } from './types/consts';
import {
  authRouter,
  userRouter,
  categoryRouter,
  productRouter,
  cartRouter,
  orderRouter,
  invoiceRouter,
} from './routes';

const MAX_JSON_BODY_SIZE = '10mb';

export function createExpressServer() {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: MAX_JSON_BODY_SIZE }));
  app.use(cookieParser());

  if (!isInProductionMode) {
    app.use(morgan(':method :url :status :res[content-length] :response-time ms - :date[iso] :remote-addr'));
  }

  // Static file serving for product images / invoice PDFs (multer/pdfkit deviation — see task spec §3).
  app.use('/uploads', express.static(path.join(process.cwd(), ENV.UPLOAD_DIR)));

  //!routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/products', productRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/invoices', invoiceRouter);

  app.get('/health', (_req, res) => {
    res.status(200).send('UP');
  });

  //@ts-expect-error
  app.use((error, _req: Request, res, _next) => {
    const { statusCode } = error || {};

    let level = LEVELS.INFO;
    switch (statusCode) {
      case STATUS_CODE.BAD_REQUEST:
      case STATUS_CODE.DUPLICATED:
      case STATUS_CODE.EXPIRED:
      case STATUS_CODE.FORBIDDEN:
      case STATUS_CODE.GONE:
      case STATUS_CODE.LOCKED:
      case STATUS_CODE.NOT_FOUND:
      case STATUS_CODE.UNAUTHORIZED:
      case STATUS_CODE.OK:
        level = LEVELS.WARNINIG;
        break;
      case STATUS_CODE.INTERNAL_SERVER:
        level = LEVELS.ERROR;
        break;
      default:
        level = LEVELS.ERROR;
        break;
    }

    if (isInDevelopmentMode && level === LEVELS.ERROR) {
      console.error(error);
    }

    res.status(error.statusCode || 500).send(error.message || '');
  });

  app.disable('x-powered-by');

  return app;
}
