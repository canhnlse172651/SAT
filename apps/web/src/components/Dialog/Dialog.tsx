import { Overlay, type OverlayProps } from '../Overlay/Overlay';

export type DialogProps = OverlayProps;

/** Centred modal: focus trap, Esc, focus returns to the opener, `aria-modal`. */
export function Dialog(props: DialogProps) {
  return <Overlay {...props} variant="dialog" />;
}
