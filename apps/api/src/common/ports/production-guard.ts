/**
 * ADR-0008: the only adapters that exist are dev adapters (outbox email, no-op scheduler), and a
 * production deploy with them would silently drop activation mail. Fails fast at composition time
 * until the provider ADRs add production adapters.
 */
export function assertNoDevAdaptersInProduction(nodeEnv: string): void {
  if (nodeEnv === 'production') {
    throw new Error(
      'Refusing to start with NODE_ENV=production: EmailSender and JobScheduler only have dev ' +
        'adapters (ADR-0008). Add the production adapters (email and scheduler provider ADRs) first.',
    );
  }
}
