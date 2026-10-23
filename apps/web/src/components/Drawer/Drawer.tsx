import { Overlay, type OverlayProps } from '../Overlay/Overlay';

export type DrawerProps = OverlayProps;

/** Desktop side panel sliding in from the right. */
export function Drawer(props: DrawerProps) {
  return <Overlay {...props} variant="drawer" />;
}
