import type { SVGProps } from 'react';
import { ICON_PATHS, type IconName } from './icon-paths';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

/** Decorative icon (aria-hidden): the control around it carries the accessible name. */
export function Icon({ name, size = 20, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      {...rest}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
