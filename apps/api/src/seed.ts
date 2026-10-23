// `npm run seed -w @sat/api`: dev accounts (GV lan@sat.dev / LanHSK2026, HV hv1–3@sat.dev / HocVien2026). Idempotent.
import mongoose from 'mongoose';
import { loadConfig } from './config.js';
import {
  USER_MODEL,
  type UserDoc,
  WORKSPACE_MODEL,
  type WorkspaceDoc,
  userSchema,
  workspaceSchema,
} from './modules/accounts/accounts.model.js';
import { seedAccounts } from './modules/accounts/accounts.seed.js';

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
    const workspaces = connection.model<WorkspaceDoc>(WORKSPACE_MODEL, workspaceSchema);
    const users = connection.model<UserDoc>(USER_MODEL, userSchema);
    await Promise.all([workspaces.init(), users.init()]);
    console.log(JSON.stringify(await seedAccounts({ users, workspaces }), null, 2));
  } finally {
    await connection.close();
  }
} catch (err) {
  console.error('seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
