import { type DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CLOCK, type Clock, FixedClock, OffsetClock } from './clock.js';
import {
  DEV_EMAIL_OPTIONS,
  DEV_OUTBOX_MODEL,
  type DevEmailOptions,
  DevOutboxEmailSender,
  DevOutboxReader,
  EMAIL_EVENTS,
  EMAIL_SENDER,
  EmailEvents,
  MemoryEmailSender,
  devOutboxSchema,
} from './email.js';
import { JOB_SCHEDULER, ManualScheduler, NoopScheduler } from './scheduler.js';
import {
  FILE_MODEL,
  FILE_STORAGE,
  LocalDiskStorage,
  MemoryStorage,
  STORAGE_OPTIONS,
  STORAGE_ROOT,
  type StorageOptions,
  fileSchema,
} from './storage.js';

export interface PortsOptions {
  /** 'dev': system clock, Mongo outbox, disk storage. 'test': fixed clock and in-memory adapters (no DB). */
  mode: 'dev' | 'test';
  /** Root directory for LocalDiskStorage (default `var/uploads`). */
  uploadsDir?: string;
  storage?: StorageOptions;
  /** Overrides the clock of either mode (the test kit passes a shared FixedClock). */
  clock?: Clock;
  /** Dev outbox simulation (`DEV_EMAIL_DELAY_MS`). */
  devEmail?: DevEmailOptions;
}

@Global()
@Module({})
export class PortsModule {
  static forRoot(options: PortsOptions): DynamicModule {
    const storage = options.storage ?? {};
    const exports = [CLOCK, EMAIL_SENDER, EMAIL_EVENTS, FILE_STORAGE, JOB_SCHEDULER];
    if (options.mode === 'test') {
      return {
        module: PortsModule,
        providers: [
          { provide: CLOCK, useValue: options.clock ?? new FixedClock() },
          { provide: EMAIL_SENDER, useClass: MemoryEmailSender },
          { provide: EMAIL_EVENTS, useValue: new EmailEvents() },
          { provide: FILE_STORAGE, useValue: new MemoryStorage(storage) },
          {
            provide: JOB_SCHEDULER,
            inject: [CLOCK],
            useFactory: (clock: Clock) => new ManualScheduler(clock),
          },
        ],
        exports,
      };
    }
    return {
      module: PortsModule,
      imports: [
        MongooseModule.forFeature([
          { name: DEV_OUTBOX_MODEL, schema: devOutboxSchema },
          { name: FILE_MODEL, schema: fileSchema },
        ]),
      ],
      providers: [
        // OffsetClock = system time unless the dev-only POST /api/dev/clock moves it.
        { provide: CLOCK, useValue: options.clock ?? new OffsetClock() },
        { provide: STORAGE_ROOT, useValue: options.uploadsDir ?? 'var/uploads' },
        { provide: STORAGE_OPTIONS, useValue: storage },
        { provide: EMAIL_EVENTS, useValue: new EmailEvents() },
        { provide: DEV_EMAIL_OPTIONS, useValue: options.devEmail ?? { delayMs: 0 } },
        DevOutboxEmailSender,
        DevOutboxReader,
        { provide: EMAIL_SENDER, useExisting: DevOutboxEmailSender },
        { provide: FILE_STORAGE, useClass: LocalDiskStorage },
        { provide: JOB_SCHEDULER, useClass: NoopScheduler },
      ],
      exports: [...exports, DevOutboxReader],
    };
  }
}
