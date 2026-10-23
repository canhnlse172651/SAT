import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DEV_USER_MODEL,
  DEV_WORKSPACE_MODEL,
  DevWorkspaceDirectory,
  WORKSPACE_DIRECTORY,
  devUserSchema,
  devWorkspaceSchema,
} from './workspace-directory.js';

/** FOUNDATION-ONLY (see workspace-directory.ts): module 001 swaps the adapter for real collections. */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DEV_WORKSPACE_MODEL, schema: devWorkspaceSchema },
      { name: DEV_USER_MODEL, schema: devUserSchema },
    ]),
  ],
  providers: [
    DevWorkspaceDirectory,
    { provide: WORKSPACE_DIRECTORY, useExisting: DevWorkspaceDirectory },
  ],
  exports: [WORKSPACE_DIRECTORY, MongooseModule],
})
export class DirectoryModule {}
