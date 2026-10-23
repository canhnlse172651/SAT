import { Overlay, type OverlayProps } from '../Overlay/Overlay';

export type BottomSheetProps = OverlayProps;

/** Mobile sheet rising from the bottom edge. */
export function BottomSheet(props: BottomSheetProps) {
  return <Overlay {...props} variant="sheet" />;
}
