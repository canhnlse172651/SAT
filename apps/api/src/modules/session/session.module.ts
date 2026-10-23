import { Module } from '@nestjs/common';
import { SessionController } from './session.controller.js';
import { SessionInfoService } from './session-info.service.js';

@Module({ controllers: [SessionController], providers: [SessionInfoService] })
export class SessionModule {}
