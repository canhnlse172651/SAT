import { describe, expect, it } from 'vitest';
import { loggerParams } from '../../logger.js';
import { getContext, requireContext, runWithContext } from './request-context.js';

describe('RequestContext', () => {
  it('is undefined outside a request and requireContext throws', () => {
    expect(getContext()).toBeUndefined();
    expect(() => requireContext()).toThrow(/outside a request/);
  });

  it('propagates across awaits and isolates concurrent contexts', async () => {
    const seen = await Promise.all(
      ['a', 'b'].map((requestId) =>
        runWithContext({ requestId }, async () => {
          await new Promise((r) => setTimeout(r, requestId === 'a' ? 10 : 1));
          return requireContext().requestId;
        }),
      ),
    );
    expect(seen).toEqual(['a', 'b']);
  });

  it('the logger mixin adds userId and workspaceId only', () => {
    const mixin = (loggerParams('silent').pinoHttp as { mixin: () => object }).mixin;
    runWithContext({ requestId: 'r', userId: 'u1', workspaceId: 'w1', role: 'GV' }, () => {
      expect(mixin()).toEqual({ userId: 'u1', workspaceId: 'w1' });
    });
  });
});
