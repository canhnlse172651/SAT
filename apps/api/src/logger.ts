import { randomUUID } from 'node:crypto';
import type { Params } from 'nestjs-pino';
import type { Config } from './config.js';

/** pino-http for every request (with a propagated `x-request-id`); also backs Nest's own logger. */
export function loggerParams(level: Config['LOG_LEVEL']): Params {
  return {
    pinoHttp: {
      level,
      redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      genReqId: (req, res) => {
        const header = req.headers['x-request-id'];
        const id = typeof header === 'string' && header.length <= 128 ? header : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
    },
  };
}
