import { type DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { STUDENT_LINKS } from '../accounts/student-links.js';
import {
  CURRICULUM_CLASSES,
  type CurriculumClasses,
  DevCurriculumLinks,
} from '../curriculum/curriculum.ports.js';
import { ClassAccess } from './class-access.js';
import { ClassCurriculumLinks, ClassStudentLinks, mergedCurriculumClasses } from './class-links.js';
import { ClassesDevController } from './classes-dev.controller.js';
import { ClassesController } from './classes.controller.js';
import {
  CLASS_MODEL,
  MEMBER_MODEL,
  REMINDER_MODEL,
  REMINDER_RUN_MODEL,
  classSchema,
  memberSchema,
  reminderRunSchema,
  reminderSchema,
} from './classes.model.js';
import {
  CLASS_EXAMS,
  CLASS_LEARNING,
  ClassFaults,
  DevClassExams,
  DevClassLearning,
} from './classes.ports.js';
import { ClassesService } from './classes.service.js';
import { ContentService } from './content.service.js';
import { LearnClassesController } from './learn-classes.controller.js';
import { LearnClassesService } from './learn-classes.service.js';
import { MembersService } from './members.service.js';
import { REMINDER_OPTIONS, ReminderService } from './reminder.service.js';

export interface ClassesModuleOptions {
  /** The curriculum module (002) whose `CurriculumReader` this module reads. */
  curriculum: DynamicModule;
  /** Origin of the links in reminder e-mails (AC-25.4). */
  appOrigin: string;
  /** `/api/dev/classes/*` stand-ins for 005 / 006 and 002's stand-in classes (development and test only). */
  devHelpers: boolean;
}

/**
 * Module 003 — classes, members, per-class visibility and deadlines, reminders. Global because it binds ports other
 * modules read: `CURRICULUM_CLASSES` (002) and `STUDENT_LINKS` (001); it exports `ClassAccess` for 004 / 005.
 */
@Global()
@Module({})
export class ClassesModule {
  static forRoot(options: ClassesModuleOptions): DynamicModule {
    return {
      module: ClassesModule,
      imports: [
        options.curriculum,
        MongooseModule.forFeature([
          { name: CLASS_MODEL, schema: classSchema },
          { name: MEMBER_MODEL, schema: memberSchema },
          { name: REMINDER_MODEL, schema: reminderSchema },
          { name: REMINDER_RUN_MODEL, schema: reminderRunSchema },
        ]),
      ],
      controllers: [
        ClassesController,
        LearnClassesController,
        ...(options.devHelpers ? [ClassesDevController] : []),
      ],
      providers: [
        { provide: REMINDER_OPTIONS, useValue: { appOrigin: options.appOrigin } },
        // 005 and 006 re-bind these when they exist (classes.ports.ts).
        DevClassLearning,
        DevClassExams,
        { provide: CLASS_LEARNING, useExisting: DevClassLearning },
        { provide: CLASS_EXAMS, useExisting: DevClassExams },
        ClassFaults,
        ClassCurriculumLinks,
        DevCurriculumLinks,
        {
          provide: CURRICULUM_CLASSES,
          useFactory: (real: ClassCurriculumLinks, dev: DevCurriculumLinks): CurriculumClasses =>
            options.devHelpers ? mergedCurriculumClasses(real, dev) : real,
          inject: [ClassCurriculumLinks, DevCurriculumLinks],
        },
        { provide: STUDENT_LINKS, useClass: ClassStudentLinks },
        ClassesService,
        MembersService,
        ContentService,
        ClassAccess,
        LearnClassesService,
        ReminderService,
      ],
      exports: [CURRICULUM_CLASSES, STUDENT_LINKS, ClassAccess],
    };
  }
}
