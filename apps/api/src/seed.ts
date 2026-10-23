// `npm run seed -w @sat/api`: dev data for the walking skeleton. Idempotent; no passwords.
import mongoose from 'mongoose';
import { seedDev } from './common/dev/seed.js';
import {
  type DevUserDoc,
  type DevWorkspaceDoc,
  DEV_USER_MODEL,
  DEV_WORKSPACE_MODEL,
  devUserSchema,
  devWorkspaceSchema,
} from './common/directory/workspace-directory.js';
import { loadConfig } from './config.js';

const config = loadConfig();
if (config.NODE_ENV === 'production') {
  console.error('Refusing to seed development data with NODE_ENV=production.');
  process.exit(1);
}

try {
  const connection = await mongoose
    .createConnection(config.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 })
    .asPromise();
  try {
    const workspaces = connection.model<DevWorkspaceDoc>(DEV_WORKSPACE_MODEL, devWorkspaceSchema);
    const users = connection.model<DevUserDoc>(DEV_USER_MODEL, devUserSchema);
    await Promise.all([workspaces.init(), users.init()]);
    console.log(JSON.stringify(await seedDev(workspaces, users), null, 2));
  } finally {
    await connection.close();
  }
} catch (err) {
  console.error('seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
