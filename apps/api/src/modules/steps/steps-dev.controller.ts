import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { objectId } from '@sat/shared';
import { z } from 'zod';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { StepFilesService } from './step-files.service.js';
import { DevStepPractice } from './steps.ports.js';

const storageBody = z.object({
  usedBytes: z
    .number()
    .int()
    .min(0)
    .max(20 * 1024 ** 3),
});
const practiceBody = z.object({ setId: objectId, stepId: objectId.nullable() });

/**
 * QA stand-ins (dev/test only — registered by `StepsModule.forRoot`): used storage without uploading gigabytes
 * (AC-5.5 – AC-5.7) and 005's "Bước học liên kết" (AC-10.x). Everything stays in the signed-in GV's workspace.
 */
@Roles('GV')
@Controller('dev/steps')
export class StepsDevController {
  constructor(
    private readonly files: StepFilesService,
    private readonly practice: DevStepPractice,
  ) {}

  @Post('storage')
  @HttpCode(204)
  async storage(@CurrentUser() p: AuthPrincipal, @Body() body: unknown): Promise<void> {
    const { usedBytes } = parse(storageBody, body);
    await this.files.setFiller(p.workspaceId, p.userId, usedBytes);
  }

  @Post('practice')
  @HttpCode(204)
  async link(@CurrentUser() p: AuthPrincipal, @Body() body: unknown): Promise<void> {
    const { setId, stepId } = parse(practiceBody, body);
    await this.practice.link(p.workspaceId, setId, stepId);
  }
}
