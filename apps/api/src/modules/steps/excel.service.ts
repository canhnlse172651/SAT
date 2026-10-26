import { Injectable } from '@nestjs/common';
import {
  type ImportPreview,
  STEP_ERROR_CODES as E,
  STEP_LIMITS,
  STEP_MESSAGES as SM,
  WORD_CLASSES,
  badPinyin,
  convertPinyin,
  excelMissingColumn,
  hasHanzi,
} from '@sat/shared';
import { AppError } from '../../errors.js';
import { InvalidXlsxError, readFirstSheet, writeWorkbook } from '../accounts/xlsx.js';
import { logStep } from './steps.log.js';

/** Columns of the template, in order (AC-12.1). */
const HEADERS = ['Chữ Hán', 'Pinyin', 'Loại từ', 'Nghĩa tiếng Việt', 'Ví dụ'] as const;
type Column = 'hanzi' | 'pinyin' | 'pos' | 'meaning' | 'example';
const FIELDS: Record<string, Column> = {
  'chữ hán': 'hanzi',
  pinyin: 'pinyin',
  'loại từ': 'pos',
  'nghĩa tiếng việt': 'meaning',
  'ví dụ': 'example',
};
/** Header match: case and surrounding spaces ignored (spec §8). */
const headerKey = (s: string) =>
  s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');

const invalid = () => new AppError(400, E.EXCEL_INVALID, SM.excelInvalid);

/** REQ-12: the vocabulary template and its import preview (the client adds the rows to the working copy). */
@Injectable()
export class ExcelService {
  template(): Uint8Array {
    return writeWorkbook([
      {
        name: 'Từ vựng',
        rows: [[...HEADERS]],
        cols: '<cols><col min="1" max="1" width="16" customWidth="1"/><col min="2" max="2" width="18" customWidth="1"/><col min="3" max="3" width="20" customWidth="1"/><col min="4" max="4" width="32" customWidth="1"/><col min="5" max="5" width="40" customWidth="1"/></cols>',
      },
      {
        name: 'Hướng dẫn',
        rows: [
          ['Cột', 'Bắt buộc', 'Quy tắc', 'Ví dụ'],
          [
            'Chữ Hán',
            'Có',
            'Chữ Hán giản thể, tối đa 50 ký tự; phải có ít nhất một chữ Hán.',
            '你好',
          ],
          [
            'Pinyin',
            'Không',
            'Tối đa 100 ký tự. Gõ có dấu (nǐ hǎo) hoặc số thanh điệu (ni3 hao3) — số được chuyển thành dấu.',
            'ni3 hao3',
          ],
          [
            'Loại từ',
            'Không',
            `Một trong: ${WORD_CLASSES.join(', ')} (không phân biệt hoa/thường). Giá trị khác để trống. Bộ thẻ bỏ qua cột này.`,
            'Cụm từ',
          ],
          ['Nghĩa tiếng Việt', 'Có', 'Tối đa 200 ký tự.', 'xin chào'],
          ['Ví dụ', 'Không', 'Tối đa 300 ký tự.', '你好，老师！'],
          [
            'Ghi chú',
            '',
            'Chỉ đọc trang đầu tiên. Dòng trống bị bỏ qua. Dòng trùng Chữ Hán và Pinyin với từ đã có hoặc với dòng phía trên bị bỏ qua. Tệp .xlsx tối đa 5 MB.',
            '',
          ],
        ],
      },
    ]);
  }

  /** AC-12.2, AC-12.3: structure checks, then valid rows, errors per Excel row and in-file duplicates. */
  preview(workspaceId: string, bytes: Uint8Array): ImportPreview {
    if (!bytes.length || bytes.length > STEP_LIMITS.excelMaxBytes) throw invalid();
    let sheet;
    try {
      sheet = readFirstSheet(bytes);
    } catch (err) {
      if (err instanceof InvalidXlsxError) throw invalid();
      throw err;
    }
    const [header, ...data] = sheet;
    const columns = new Map<Column, number>();
    (header?.cells ?? []).forEach((cell, i) => {
      const field = FIELDS[headerKey(cell)];
      if (field && !columns.has(field)) columns.set(field, i);
    });
    for (const [col, field] of [
      ['Chữ Hán', 'hanzi'],
      ['Nghĩa tiếng Việt', 'meaning'],
    ] as const) {
      if (!columns.has(field)) throw new AppError(422, E.EXCEL_INVALID, excelMissingColumn(col));
    }
    const cell = (cells: string[], f: Column) => {
      const i = columns.get(f);
      return i === undefined ? '' : (cells[i] ?? '').trim();
    };
    const out: ImportPreview = { rows: [], errors: [], duplicates: [] };
    const seen = new Set<string>();
    for (const { line, cells } of data) {
      const hanzi = cell(cells, 'hanzi');
      const pinyin = convertPinyin(cell(cells, 'pinyin'));
      const posRaw = cell(cells, 'pos');
      const meaning = cell(cells, 'meaning');
      const example = cell(cells, 'example');
      if (!hanzi && !pinyin && !posRaw && !meaning && !example) continue;
      const bad = badPinyin(pinyin);
      const reason = !hanzi
        ? 'Thiếu Chữ Hán'
        : !hasHanzi(hanzi)
          ? 'Chữ Hán không chứa chữ Hán nào'
          : [...hanzi].length > STEP_LIMITS.hanziMax
            ? 'Chữ Hán tối đa 50 ký tự'
            : !meaning
              ? 'Thiếu Nghĩa tiếng Việt'
              : [...meaning].length > STEP_LIMITS.meaningMax
                ? 'Nghĩa tối đa 200 ký tự'
                : [...pinyin].length > STEP_LIMITS.pinyinMax
                  ? 'Pinyin tối đa 100 ký tự'
                  : bad
                    ? `Pinyin không hợp lệ: ${bad}`
                    : [...example].length > STEP_LIMITS.exampleMax
                      ? 'Ví dụ tối đa 300 ký tự'
                      : null;
      if (reason) {
        out.errors.push({ line, reason });
        continue;
      }
      const key = `${hanzi}|${pinyin.toLowerCase()}`;
      if (seen.has(key)) {
        out.duplicates.push({ line, hanzi, pinyin });
        continue;
      }
      seen.add(key);
      const pos =
        WORD_CLASSES.find((c) => c.toLocaleLowerCase('vi') === posRaw.toLocaleLowerCase('vi')) ??
        '';
      out.rows.push({ line, hanzi, pinyin, pos, meaning, example });
    }
    logStep({
      action: 'excel.import',
      workspaceId,
      valid: out.rows.length,
      errors: out.errors.length,
      duplicates: out.duplicates.length,
    });
    return out;
  }
}
