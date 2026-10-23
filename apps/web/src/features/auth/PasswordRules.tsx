import { passwordRules } from '@sat/shared';
import { CheckIcon } from '../../components/icons';
import './auth.css';

/** AC-2.3: both rules are always listed under a new-password field and follow what is typed. */
export function PasswordRules({ value, id }: { value: string; id?: string }) {
  return (
    <ul className="pw-rules" id={id} aria-label="Quy tắc mật khẩu">
      {passwordRules(value).map((rule) => (
        <li key={rule.label} className={rule.ok ? 'pw-rules__ok' : undefined}>
          {rule.ok ? (
            <CheckIcon width={16} height={16} aria-hidden="true" />
          ) : (
            <span className="pw-rules__dot" aria-hidden="true" />
          )}
          <span>{rule.label}</span>
          <span className="sr-only">{rule.ok ? ' — đạt' : ' — chưa đạt'}</span>
        </li>
      ))}
    </ul>
  );
}
