import mongoose, { ConnectOptions } from 'mongoose';
import { ENV } from './env';

const options: ConnectOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
};

export async function connectToDatabase(uri = ENV.MONGO_URI, extraOptions: ConnectOptions = {}): Promise<mongoose.Connection> {
  if (!uri) {
    throw new Error('MONGO_URI not provided');
  }

  await mongoose.connect(uri, { ...options, ...extraOptions });
  return mongoose.connection;
}
