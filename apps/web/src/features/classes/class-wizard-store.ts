import { CLASS_LIMITS, type CurriculumOption, type StudentOption } from '@sat/shared';
import { create } from 'zustand';

export type WizardStep = 1 | 2 | 3 | 4;
export const WIZARD_STEPS = [
  'Thông tin lớp',
  'Thêm học viên',
  'Chọn giáo trình',
  'Xác nhận',
] as const;

export interface ClassInfo {
  name: string;
  /** 00:00 VN of the chosen day (DatePicker value). */
  startDate: Date | null;
  description: string;
  schedule: string;
}

export type PickedStudent = Pick<StudentOption, 'id' | 'displayName' | 'email' | 'status'>;

const EMPTY_INFO: ClassInfo = { name: '', startDate: null, description: '', schedule: '' };
const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface WizardState {
  step: WizardStep;
  info: ClassInfo;
  selected: PickedStudent[];
  curriculum: CurriculumOption | null;
  /** One per wizard run: the server creates at most one class for it (AC-5.6). */
  createKey: string;

  setStep: (step: WizardStep) => void;
  setInfo: (patch: Partial<ClassInfo>) => void;
  /** Adds students up to the 100 cap; returns false when some did not fit (AC-3.5). */
  select: (students: PickedStudent[]) => boolean;
  unselect: (id: string) => void;
  clearSelection: () => void;
  setCurriculum: (c: CurriculumOption | null) => void;
  /** Anything entered or chosen (AC-1.5, AC-1.6). */
  isDirty: () => boolean;
  reset: () => void;
}

/** T03 data, in memory only: nothing is saved as a draft or restored (spec §9). */
export const useClassWizardStore = create<WizardState>()((set, get) => ({
  step: 1,
  info: EMPTY_INFO,
  selected: [],
  curriculum: null,
  createKey: newKey(),

  setStep: (step) => set({ step }),
  setInfo: (patch) => set((s) => ({ info: { ...s.info, ...patch } })),
  select: (students) => {
    const have = new Set(get().selected.map((s) => s.id));
    const fresh = students.filter((s) => !have.has(s.id));
    const room = CLASS_LIMITS.maxStudents - get().selected.length;
    set((s) => ({ selected: [...s.selected, ...fresh.slice(0, Math.max(0, room))] }));
    return fresh.length <= room;
  },
  unselect: (id) => set((s) => ({ selected: s.selected.filter((x) => x.id !== id) })),
  clearSelection: () => set({ selected: [] }),
  setCurriculum: (curriculum) => set({ curriculum }),
  isDirty: () => {
    const { info, selected, curriculum } = get();
    return (
      !!info.name.trim() ||
      !!info.startDate ||
      !!info.description.trim() ||
      !!info.schedule.trim() ||
      selected.length > 0 ||
      !!curriculum
    );
  },
  reset: () =>
    set({ step: 1, info: EMPTY_INFO, selected: [], curriculum: null, createKey: newKey() }),
}));
