import * as React from "react";
import { HexColorPicker } from "react-colorful";

export type ColorPickerProps = React.ComponentPropsWithoutRef<typeof HexColorPicker>;

export function ColorPicker(props: ColorPickerProps) {
	return <HexColorPicker {...props} />;
}
