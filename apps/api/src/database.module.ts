import { type DynamicModule, Global, Module } from '@nestjs/common';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import mongoose, { type Connection } from 'mongoose';

/** Injection token for the readiness probe: true while MongoDB is connected. */
export const DB_READY = Symbol('DB_READY');
export type DbReady = () => boolean;

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(uri: string): DynamicModule {
    mongoose.set('strictQuery', true);
    return {
      module: DatabaseModule,
      imports: [
        // Fail fast: an instance that cannot reach MongoDB at boot exits and lets the platform restart it.
        MongooseModule.forRoot(uri, { serverSelectionTimeoutMS: 5_000, retryAttempts: 0 }),
      ],
      providers: [
        {
          provide: DB_READY,
          inject: [getConnectionToken()],
          useFactory:
            (connection: Connection): DbReady =>
            () =>
              connection.readyState === mongoose.ConnectionStates.connected,
        },
      ],
      exports: [DB_READY],
    };
  }
}
