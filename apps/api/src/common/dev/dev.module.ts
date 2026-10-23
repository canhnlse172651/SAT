import { Module } from '@nestjs/common';
import { DevController } from './dev.controller.js';
import { DevService } from './dev.service.js';

@Module({ controllers: [DevController], providers: [DevService] })
export class DevModule {}

/** `/api/dev/*` exists only in development and test; a production boot registers nothing (ADR-0008). */
export function devModules(nodeEnv: string): (typeof DevModule)[] {
  return nodeEnv === 'development' || nodeEnv === 'test' ? [DevModule] : [];
}
