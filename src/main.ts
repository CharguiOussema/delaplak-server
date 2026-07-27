import 'dotenv/config';
import 'express-async-errors';
import http from 'http';
import { AddressInfo } from 'net';
import 'reflect-metadata';
import { ENV, connectToDatabase } from './config';
import { createExpressServer } from './server';
import { ENVIRONMENTS } from './types/consts';

Object.keys(ENV).forEach((key) => {
  //@ts-expect-error
  if (!ENV[key] && ENV[key] !== 0) {
    console.warn(`missing env variable for ${key}`);
  }
});
if (!Object.values(ENVIRONMENTS).includes(ENV.NODE_ENV)) {
  console.error(`Invalid NODE_ENV: ${ENV.NODE_ENV} please use one of ${Object.values(ENVIRONMENTS).join(', ')}`);
  process.exit(1);
}

async function bootstrap() {
  console.warn(`Running in ${process.env.NODE_ENV} mode`);
  const connection = await connectToDatabase();
  const app = createExpressServer();

  const server = http.createServer(app).listen(ENV.SERVER_PORT, undefined, async () => {
    const addressInfo = server.address() as AddressInfo;
    let displayAddress = addressInfo.address;

    if (addressInfo.address === '::' || addressInfo.address === '0.0.0.0') {
      displayAddress = 'localhost';
    }

    console.log(`Server running at http://${displayAddress}:${addressInfo.port}`);
  });

  const signalsTraps: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  signalsTraps.forEach((type) => {
    process.once(type, () =>
      server.close(() => {
        console.log('Http server closed');
        connection.close();
        console.log('disconnection from database');
        process.exit();
      }),
    );
  });
}

bootstrap();
