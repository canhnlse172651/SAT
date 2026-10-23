/** Settings of module 001 taken from the environment (config.ts). */
export interface AccountsOptions {
  /** Public origin of the SPA, for links in e-mails (A01, A03). */
  appOrigin: string;
}

export const ACCOUNTS_OPTIONS = Symbol('ACCOUNTS_OPTIONS');
