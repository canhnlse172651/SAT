# SAT Design System — “Mực & giấy” (ink & paper)

Source of truth for the visual layer of `apps/web`. The reference implementation is section
**1. DESIGN TOKENS** and **12. MỰC & GIẤY** of `specs/screen-flow-design.html`; copy tokens from there or below.

## Direction

An editorial, academic calm — a well-made Chinese textbook, not a generic SaaS dashboard.
Warm paper backgrounds, white work surfaces, near-black ink text, hairline rules instead of card shadows,
tight radii. One accent: **son đỏ** (vermilion seal, 印章) — used sparingly for the brand seal, the active
nav/tab marker, pinyin and a few key highlights. Actions are **indigo ink**, never red. **Hanzi is the
memorable element**: set in Noto Serif SC wherever students learn.

## Colour tokens

```css
:root {
  /* paper & surfaces */
  --bg: #f6f3ec; --bg-sunk: #ece7dc; --surface: #ffffff; --surface-2: #faf8f3; --paper-card: #fcfaf4;
  --side-bg: #f0ebe1; --border: #e6e0d4; --border-strong: #d2cabb; --border-input: #958c7a; --control-off: #857f74;
  /* ink */
  --text: #1a2130; --text-2: #4c5260; --text-3: #62666f;
  --ink: #1b2333; --ink-2: #263147; --ink-3: #3b4863;
  --on-dark: #ffffff; --on-dark-2: #bcc2cd; --on-dark-line: rgba(255,255,255,.45);
  /* accent: vermilion seal */
  --brand: #c0362c; --brand-strong: #96271f; --brand-soft: #f8e6e1; --brand-wash: #fdf6f3; --brand-line: #eec4bb; --brand-on-dark: #f0806f;
  /* action: indigo ink */
  --primary: #263d7a; --primary-strong: #1a2c5c; --primary-soft: #e8ebf4; --primary-wash: #f3f5fa; --primary-line: #c3cbe2; --primary-text: #1d2f62;
  /* feedback */
  --success: #1f6b43; --success-soft: #e5f0e7; --success-line: #a9cdb4; --success-text: #154d30; --success-on-dark: #8fd9ac;
  --warn: #8a5600; --warn-soft: #fbf0d8; --warn-line: #e6c77e; --warn-text: #6b4300; --warn-strong: #74480a; --warn-on-dark: #ffd27a;
  --danger: #b42318; --danger-soft: #fbe9e6; --danger-line: #efbab2; --danger-text: #861a11; --danger-strong: #8f1d14; --danger-wash: #fdf5f3;
  /* tracking status: Chưa làm · Đã làm · Nộp muộn · Quá hạn */
  --st-todo: #575c68; --st-todo-bg: #eeebe4; --st-done: #1f6b43; --st-done-bg: #e5f0e7;
  --st-pending: #8a5600; --st-pending-bg: #fbf0d8; --st-over: #b42318; --st-over-bg: #fbe9e6;
  /* AI (010) */
  --ai: #5a3fb4; --ai-strong: #432f8a; --ai-soft: #efebfa; --ai-wash: #f6f3fd; --ai-line: #d3c8f2; --ai-text: #33236f;
  /* HSK 1–9 badges (white text ≥ 4.5:1) */
  --hsk1: #2e7d32; --hsk2: #00796b; --hsk3: #0277bd; --hsk4: #3949ab; --hsk5: #6a1b9a;
  --hsk6: #ad1457; --hsk7: #c62828; --hsk8: #bf360c; --hsk9: #6d4c41;
  /* data */
  --medal-1: #e9b949; --medal-1-ink: #4a3500; --medal-2: #d9d6cf; --medal-2-ink: #2f3440; --medal-3: #dfa577; --medal-3-ink: #4a2508;
  --file-pdf: #b42318; --file-doc: #2b579a; --file-xls: #1d6f42; --file-media: #6e4a86; --file-other: #676b75;
  --chart-bar: #aab5d4; --me-wash: #fdf4e3; --me-line: #e6c77e; --scrim: rgba(21,26,36,.5);
}
```

| Role | Token | Rule |
|------|-------|------|
| Page background | `--bg` | Warm paper. Never pure white behind content. |
| Work surface | `--surface` | Cards, tables, inputs, dialogs. |
| Quiet fill | `--surface-2` | Table header, hover row, read-only input. |
| Text | `--text` / `--text-2` / `--text-3` | 14.5 / 7.1 / 5.2 : 1 on paper. `--text-3` is the lightest allowed text. |
| Primary action | `--primary` | Filled buttons, links, selected option, checked box. White text 10.3 : 1. |
| Accent | `--brand` | Seal, active marker, pinyin, current question ring. ≤ 2 red elements per view. |
| Dark band | `--ink` | HV header, full-screen dialog head, auth panel, toast, podium. |

## Typography

| Family | Token | Use |
|--------|-------|-----|
| Be Vietnam Pro 400–800 | `--font-ui` | All UI text, buttons, chips, tables, numbers. |
| Newsreader 500/600 (has Vietnamese) | `--font-display` | Screen titles (`.page-title`), HV header `h1`, dialog/sheet titles, card heads, class/curriculum names, profile name, score hero. |
| Noto Serif SC 500–700 | `--font-han-serif` | Hanzi in learning content: vocabulary, flashcards, dialogue, passages, cloze, word tiles, answer options, HV/preview views, the seal 汉. |
| Noto Sans SC 400–700 | `--font-han` | Hanzi inside inputs and dense GV editor UI; fallback. |

Scale: `--fs-2xs 11 · --fs-xs 12 · --fs-sm 13 · --fs-base 14 · --fs-md 15 · --fs-lg 17 · --fs-xl 20 · --fs-2xl 24 · --fs-3xl 30`.
Page title 30/600 serif, dialog title 21, HV header 19, card head 18. Hanzi: `--fs-han-md 22` (cloze), `--fs-han-lg 28`
(vocabulary), `--fs-han-xl 40` (word prompt), `--fs-han-hero 76` (flashcard). Line height: `--lh-base 1.5`, reading
`--lh-read 1.75`, Hanzi passages `--lh-han 1.9`–2.

Hanzi rules: simplified Hanzi always in an element with `lang="zh-Hans"` (`.han`); pinyin (`.py`, `rt`) uses `--font-ui`
with tone marks, in `--brand` on vocabulary/flashcards/ruby, `--text-2` elsewhere. Hanzi inside a serif heading uses the
serif SC face. Numbers in scores, counts, tables, dates: `font-variant-numeric: tabular-nums`.
Pinyin font: Newsreader and Be Vietnam Pro lack third-tone vowels (ǎ ǐ ǒ ǔ ǚ). Never set pinyin in the display serif
(headings use `:is(h1,h2,h3,.page-title) .py { font-family: var(--font-ui) }`); in `apps/web` add a pinyin-capable
fallback (e.g. a Noto Sans subset with Latin Extended-B) to the `.py` stack so tone marks stay attached.

## Space, radius, elevation, motion

```css
:root {
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 20px; --sp-6: 24px; --sp-8: 32px; --touch: 44px;
  --r-xs: 3px; --r-sm: 4px; --r-md: 6px; --r-lg: 8px; --r-xl: 12px; --r-pill: 999px;
  --shadow-card: 0 1px 0 rgba(27,35,51,.04);
  --shadow-raise: 0 1px 2px rgba(27,35,51,.07), 0 2px 8px rgba(27,35,51,.05);
  --shadow-pop: 0 2px 6px rgba(27,35,51,.08), 0 18px 44px -12px rgba(27,35,51,.32);
  --focus: 0 0 0 3px rgba(38,61,122,.24); --focus-color: #263d7a;
  --dur-1: 120ms; --dur-2: 180ms; --dur-flip: 380ms; --ease: cubic-bezier(.2,.7,.2,1);
}
```

- Radius: controls `--r-md`, cards/panels/dialogs `--r-lg`, HV sheets and flashcards `--r-xl`, pills only for status chips, filter chips, avatars.
- Elevation: cards are hairline (`--border`) + `--shadow-card`. Only floating layers (dialog, popover, drawer, sheet, toast) use `--shadow-pop`; sticky bars use `--shadow-raise`.
- Motion: colour/border transitions `--dur-1`; dialogs fade + 8px rise, drawer slides 24px, sheet rises 24px, popover drops 4px, toast rises 8px — all `--dur-2 --ease`, opacity/transform only. Flashcard flip `--dur-flip`. `prefers-reduced-motion: reduce` collapses every animation/transition to 1 ms.

## Components

- **Buttons** (`.btn`, min-height 40, HV 44–48): `primary` = indigo fill; `outline` = white + `--border-strong`, hover `--border-input`; `ghost` = indigo text, hover `--primary-soft`; `danger` / `danger-outline`; `success` only for “Duyệt”. Hover darkens (`*-strong`), active moves 1px down, disabled = opacity .45 with no hover change. Only one primary per view region.
- **Status chips** (`.chip`, 22px pill, 12/600): **Đã làm** `.done` (green), **Chưa làm** `.todo` (neutral), **Nộp muộn** `.pending` (amber), **Quá hạn** `.danger` (red). Same palette in matrix cells (`.cell.*`). Text + colour, never colour alone.
- **HSK badge** (`.hsk`): 22px, `--r-xs`, white 11.5/700 on `--hsk{n}` via `--hc`.
- **Tabs** (`.tab`, `.utab`): ink text; selected = `--text` + 2px `--brand` underline; hover adds a `--border-strong` underline. Counts in `--text-3` (selected: `--brand`).
- **Segmented** (`.seg`): `--bg-sunk` track, pressed item white + `--shadow-raise`.
- **Table** (`.tbl`): header `--surface-2`, 12/600 `--text-2`, bottom rule `--border-strong`; rows hairline; clickable row hover `--surface-2`; numbers tabular, right-aligned.
- **Inputs**: 40px (HV 48px, 16px text), border `--border-input` (3.3 : 1), focus = indigo border + `--focus` ring, error = `--danger`.
- **Dialog / confirm**: white, `--r-lg` (phone confirm `--r-xl`), serif title, footer actions right-aligned (phone: equal-width pair). Scrim `--scrim`.
- **Toast**: `--ink` pill-ish (`--r-lg`), white 13px, success icon `--success-on-dark`, warn icon `--warn-on-dark`; bottom-centre, 2.8 s.
- **Flashcard**: 360px card, `--r-xl`, white front / `--paper-card` back, Hanzi 76px serif, pinyin 24px `--brand`, meaning 22px serif.
- **Question card** (HV): question 17/600; options are 54px rows, 1.5px `--border-strong`, selected = `--primary` border + `--primary-wash`, letter disc fills indigo; Hanzi in options 20px serif. Question navigator discs 40px; current = `--brand` ring.
- **Callout / banner**: tinted fill + matching `*-line` border + `*-text` colour (info/warn/danger/ok/neutral/AI).
- **Sidebar nav** (GV): `--side-bg`, items 42px; active = white item + 3px `--brand` bar + brand icon.

## Layout: GV desktop vs HV mobile

| | GV desktop (≥ 1280 px) | HV mobile (360–430 px) |
|---|---|---|
| Shell | Paper sidebar 236px + paper top bar 60px (crumbs, search, bell) + content padding 24/28 | Ink header 52px (serif title) + content + bottom tab bar 62px (vermilion marker) |
| Density | Dense, scannable: tables, 40px controls, 13–14px body | Roomier: 15px body, 44px min targets, 48px inputs/footer buttons |
| Surfaces | White cards on paper; editor panes 2-column | Full-width rows (`.lrow` 64px) and cards with 16px gutter |
| Hanzi | Sans in editors, serif in previews (T20/T21) | Serif everywhere content is learned |

## Accessibility

- Contrast AA: body text ≥ 4.5 : 1 (lightest is `--text-3`, 4.8 on sidebar); control edges/tracks ≥ 3 : 1 against white (`--border-input`).
- Every control has visible `:focus-visible` (2px `--focus-color` outline, offset 2) plus hover, active and disabled states.
- Touch targets ≥ 44 × 44 on HV; icon buttons 44 (GV small 36).
- Status is always text + colour (chips, matrix cells), never colour only. Hanzi elements carry `lang="zh-Hans"`, pinyin `lang="zh-Latn-pinyin"`.
- Honour `prefers-reduced-motion`; no autoplay motion besides the AI-progress pulse (also reduced).
