import { matchPath, useLocation } from 'react-router';
import { SCREENS, type Screen } from '../app/screens';
import { NOT_FOUND_PATH } from '../lib/home-path';

/** A05 has no route table entry (it is public); shells still name it. */
const NOT_FOUND: Screen = {
  id: 'A05',
  name: 'Không tìm thấy nội dung',
  path: NOT_FOUND_PATH,
  area: 'auth',
};

/** The screen (A/T/S id) whose route matches the current URL — shells show its name. */
export function useCurrentScreen(): Screen | undefined {
  const { pathname } = useLocation();
  return SCREENS.find((s) => matchPath({ path: s.path, end: true }, pathname)) ?? NOT_FOUND;
}
