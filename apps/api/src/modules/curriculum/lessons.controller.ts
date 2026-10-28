import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import {
  type Lesson,
  addItemBodySchema,
  itemVersionBodySchema,
  lessonRenameBodySchema,
  moveItemBodySchema,
  publishLessonBodySchema,
  saveItemBodySchema,
} from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { LessonsService } from './lessons.service.js';
import { pathId } from './path-id.js';

/** T18 / T07 / T21 — GV only (AC-17.1, AC-17.2). */
@Roles('GV')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get(':id')
  get(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<Lesson> {
    return this.lessons.get(p, pathId(id));
  }

  @Patch(':id')
  rename(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<Lesson> {
    const lessonId = pathId(id);
    return this.lessons.rename(p, lessonId, parse(lessonRenameBodySchema, body));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<void> {
    return this.lessons.remove(p, pathId(id));
  }

  @Post(':id/duplicate')
  @HttpCode(201)
  duplicate(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<Lesson> {
    return this.lessons.duplicate(p, pathId(id));
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<Lesson> {
    const lessonId = pathId(id);
    return this.lessons.publish(p, lessonId, parse(publishLessonBodySchema, body));
  }

  @Post(':id/items')
  @HttpCode(201)
  addItem(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    const lessonId = pathId(id);
    return this.lessons.addItem(p, lessonId, parse(addItemBodySchema, body));
  }

  @Put(':id/items/:itemId')
  save(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: unknown,
  ): Promise<Lesson> {
    const [lessonId, item] = [pathId(id), pathId(itemId)];
    return this.lessons.saveItem(p, lessonId, item, parse(saveItemBodySchema, body));
  }

  @Post(':id/items/:itemId/publish')
  @HttpCode(200)
  publishItem(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: unknown,
  ): Promise<Lesson> {
    const [lessonId, item] = [pathId(id), pathId(itemId)];
    return this.lessons.publishItem(p, lessonId, item, parse(saveItemBodySchema, body));
  }

  @Post(':id/items/:itemId/archive')
  @HttpCode(200)
  archive(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: unknown,
  ): Promise<Lesson> {
    const [lessonId, item] = [pathId(id), pathId(itemId)];
    const { expectedVersion } = parse(itemVersionBodySchema, body);
    return this.lessons.setArchived(p, lessonId, item, expectedVersion, true);
  }

  @Post(':id/items/:itemId/restore')
  @HttpCode(200)
  restore(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: unknown,
  ): Promise<Lesson> {
    const [lessonId, item] = [pathId(id), pathId(itemId)];
    const { expectedVersion } = parse(itemVersionBodySchema, body);
    return this.lessons.setArchived(p, lessonId, item, expectedVersion, false);
  }

  /** 005 AC-18.5 "Nhân bản" of a set. */
  @Post(':id/items/:itemId/duplicate')
  @HttpCode(201)
  duplicateItem(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    const [lessonId, item] = [pathId(id), pathId(itemId)];
    return this.lessons.duplicateItem(p, lessonId, item);
  }

  @Post(':id/items/:itemId/move')
  @HttpCode(200)
  move(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: unknown,
  ) {
    const [lessonId, item] = [pathId(id), pathId(itemId)];
    return this.lessons.moveItem(p, lessonId, item, parse(moveItemBodySchema, body));
  }

  @Delete(':id/items/:itemId')
  deleteItem(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<Lesson> {
    const [lessonId, item] = [pathId(id), pathId(itemId)];
    return this.lessons.deleteItem(p, lessonId, item);
  }
}
