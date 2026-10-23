import { HSK_BANDS } from '@sat/shared';
import { useState, type ReactNode } from 'react';
import {
  AudioButton,
  Avatar,
  BottomSheet,
  Button,
  Checkbox,
  ConfirmDialog,
  DataTable,
  DatePicker,
  Dialog,
  Drawer,
  EmptyState,
  ErrorState,
  HanziText,
  HskBadge,
  Icon,
  ICON_PATHS,
  type IconName,
  IconButton,
  Pagination,
  PinyinText,
  SegmentedControl,
  Select,
  Skeleton,
  StatusChip,
  Switch,
  Tabs,
  TextField,
  Textarea,
  Toast,
  ToastViewport,
  type Column,
  type SortState,
  type StatusKind,
  type ToastData,
} from '../../components';
import { CloseIcon } from '../../components/icons';
import './UiCatalog.css';

const STATUSES: StatusKind[] = [
  'done',
  'todo',
  'doing',
  'late',
  'overdue',
  'notOpen',
  'draft',
  'published',
  'archived',
  'locked',
];

interface Student {
  id: string;
  name: string;
  done: number;
  status: StatusKind;
}

const STUDENTS: Student[] = [
  { id: '1', name: 'Nguyễn Văn An', done: 12, status: 'done' },
  { id: '2', name: 'Trần Thị Bình', done: 7, status: 'late' },
  { id: '3', name: 'Lê Hoàng Cường', done: 0, status: 'todo' },
];

const COLUMNS: Array<Column<Student>> = [
  {
    key: 'name',
    header: 'Học viên',
    sortable: true,
    render: (s) => (
      <span className="cat__who">
        <Avatar name={s.name} size="sm" /> {s.name}
      </span>
    ),
  },
  { key: 'done', header: 'Bộ đã làm', sortable: true, align: 'right' },
  { key: 'status', header: 'Trạng thái', render: (s) => <StatusChip status={s.status} /> },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cat__section">
      <h2 className="cat__h">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="cat__row">{children}</div>;
}

/** Everything in one scrolling column; rendered once at desktop width and once in a 390 px phone frame. */
function Showcase({ mobile }: { mobile: boolean }) {
  const size = mobile ? 'lg' : 'md';
  const [tab, setTab] = useState('lesson');
  const [seg, setSeg] = useState('all');
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(false);
  const [text, setText] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(3);
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [side, setSide] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const sorted = [...STUDENTS].sort((a, b) => {
    const k = sort.key as 'name' | 'done';
    const r = a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0;
    return sort.direction === 'asc' ? r : -r;
  });

  return (
    <div className={mobile ? 'cat__scope cat__scope--hv' : 'cat__scope'}>
      <Section title="Button">
        <Row>
          <Button size={size}>Primary</Button>
          <Button size={size} variant="outline">
            Outline
          </Button>
          <Button size={size} variant="ghost">
            Ghost
          </Button>
          <Button size={size} variant="danger">
            Danger
          </Button>
          <Button size={size} variant="success">
            Duyệt
          </Button>
        </Row>
        <Row>
          <Button size={size} loading>
            Đang lưu
          </Button>
          <Button size={size} disabled>
            Disabled
          </Button>
          <IconButton aria-label="Đóng" icon={<CloseIcon />} />
          <IconButton aria-label="Đóng nhỏ" icon={<CloseIcon />} size="sm" />
        </Row>
      </Section>

      <Section title="StatusChip · HskBadge">
        <Row>
          {STATUSES.map((s) => (
            <StatusChip key={s} status={s} />
          ))}
        </Row>
        <Row>
          {HSK_BANDS.map((b) => (
            <HskBadge key={b} band={b} />
          ))}
        </Row>
      </Section>

      <Section title="Tabs · SegmentedControl">
        <Tabs
          aria-label="Soạn bài"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'lesson', label: 'Bài học', content: <p>Nội dung phần Bài học.</p> },
            { id: 'exercise', label: 'Bài tập', count: 4, content: <p>Nội dung phần Bài tập.</p> },
          ]}
        />
        <SegmentedControl
          aria-label="Lọc"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'done', label: 'Đã làm' },
            { value: 'todo', label: 'Chưa làm' },
          ]}
        />
      </Section>

      <Section title="Form controls">
        <div className="cat__form">
          <TextField size={size} label="Họ và tên" hint="Như trên giấy tờ" required />
          <TextField
            size={size}
            label="Email"
            defaultValue="khong-hop-le"
            error="Email không hợp lệ"
          />
          <TextField size={size} label="Mã lớp" disabled defaultValue="HSK3-A" />
          <Textarea
            size={size}
            label="Mô tả ngắn"
            maxLength={200}
            value={text}
            onChange={(e) => setText(e.target.value)}
            hint="Tối đa 200 ký tự"
          />
          <Select
            size={size}
            label="Cấp độ"
            placeholder="Chọn cấp độ"
            options={HSK_BANDS.map((b) => ({ value: String(b), label: `HSK ${b}` }))}
          />
          <DatePicker
            size={size}
            label="Hạn nộp"
            value={date}
            onChange={setDate}
            hint="23:59 giờ Việt Nam"
          />
          <Checkbox
            label="Ghi nhớ đăng nhập"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <Switch label="Hiện với lớp này" checked={on} onChange={setOn} />
        </div>
      </Section>

      <Section title="Hanzi · Pinyin · Audio">
        <Row>
          <HanziText size="hero">汉</HanziText>
          <div>
            <HanziText size="lg">你好，学习汉语</HanziText>
            <div>
              <PinyinText tone="brand">ni3 hao3</PinyinText>
            </div>
            <PinyinText>Wǒ xǐhuan xuéxí Hànyǔ（ǎ ǐ ǒ ǔ ǚ）</PinyinText>
            <div>
              <HanziText serif={false}>编辑器中的汉字</HanziText>
            </div>
          </div>
          <AudioButton src="/dev-missing.mp3" />
        </Row>
      </Section>

      <Section title="DataTable · Pagination · Avatar">
        <DataTable
          caption="Học viên của lớp"
          columns={COLUMNS}
          rows={sorted}
          getRowKey={(s) => s.id}
          sort={sort}
          onSortChange={setSort}
          onRowClick={() => undefined}
        />
        <DataTable caption="Bảng trống" columns={COLUMNS} rows={[]} getRowKey={(s) => s.id} />
        <Pagination page={page} pageCount={12} onChange={setPage} />
        <Row>
          <Avatar name="Nguyễn Văn An" size="sm" />
          <Avatar name="Trần Thị Bình" />
          <Avatar name="Lê Cường" size="lg" />
          <Avatar name="Nguyễn Minh Anh" size="xxl" />
        </Row>
        <Row>
          {(Object.keys(ICON_PATHS) as IconName[]).map((name) => (
            <span key={name} title={name}>
              <Icon name={name} />
            </span>
          ))}
        </Row>
      </Section>

      <Section title="States">
        <EmptyState
          title="Chưa có lớp học"
          description="Tạo lớp đầu tiên để thêm học viên."
          action={<Button size={size}>Tạo lớp</Button>}
        />
        <ErrorState requestId="req-7f3a9c" onRetry={() => undefined} />
        <div className="cat__skel" aria-busy="true">
          <Skeleton circle width={40} height={40} />
          <Skeleton lines={3} />
        </div>
      </Section>

      <Section title="Overlays · Toast">
        <Row>
          <Button size={size} variant="outline" onClick={() => setDialog(true)}>
            Dialog
          </Button>
          <Button size={size} variant="outline" onClick={() => setConfirm(true)}>
            ConfirmDialog
          </Button>
          <Button size={size} variant="outline" onClick={() => setSide(true)}>
            {mobile ? 'BottomSheet' : 'Drawer'}
          </Button>
          <Button
            size={size}
            variant="outline"
            onClick={() =>
              setToasts((t) => [
                ...t,
                { id: String(Date.now()), kind: 'success', message: 'Đã lưu thay đổi' },
              ])
            }
          >
            Toast
          </Button>
        </Row>
        <div className="cat__toasts">
          <Toast kind="success" message="Đã lưu thay đổi" />
          <Toast kind="warn" message="Hạn nộp đã qua" />
          <Toast kind="error" message="Không lưu được" />
        </div>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="Thêm học viên"
          footer={
            <>
              <Button variant="outline" onClick={() => setDialog(false)}>
                Hủy
              </Button>
              <Button onClick={() => setDialog(false)}>Lưu</Button>
            </>
          }
        >
          <TextField label="Email học viên" />
        </Dialog>
        <ConfirmDialog
          open={confirm}
          tone="danger"
          title="Xóa bài này?"
          message="Bài đã có bài nộp sẽ được lưu trữ, điểm vẫn giữ."
          confirmLabel="Xóa"
          onConfirm={() => setConfirm(false)}
          onCancel={() => setConfirm(false)}
        />
        {mobile ? (
          <BottomSheet
            open={side}
            onClose={() => setSide(false)}
            title="Bộ lọc"
            footer={<Button onClick={() => setSide(false)}>Áp dụng</Button>}
          >
            <SegmentedControl
              aria-label="Lọc"
              value={seg}
              onChange={setSeg}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'done', label: 'Đã làm' },
              ]}
            />
          </BottomSheet>
        ) : (
          <Drawer open={side} onClose={() => setSide(false)} title="Chi tiết học viên">
            <p>Nội dung ngăn kéo bên phải.</p>
          </Drawer>
        )}
        <ToastViewport
          toasts={toasts}
          onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
        />
      </Section>
    </div>
  );
}

export function UiCatalog() {
  return (
    <main className="cat">
      <h1 className="page-title">UI kit — Mực &amp; giấy</h1>
      <p className="cat__lead">
        Mọi component và trạng thái. Bên trái: giáo viên (desktop). Bên phải: học viên (390 px).
      </p>
      <div className="cat__cols">
        <div className="cat__desktop">
          <h2 className="cat__frame-title">GV desktop</h2>
          <Showcase mobile={false} />
        </div>
        <div className="cat__phone-wrap">
          <h2 className="cat__frame-title">HV mobile · 390 px</h2>
          <div className="cat__phone">
            <Showcase mobile />
          </div>
        </div>
      </div>
    </main>
  );
}
