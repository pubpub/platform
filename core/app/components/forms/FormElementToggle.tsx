"use client";

import type { PropsWithChildren } from "react";

import { Toggle } from "ui/toggle";

import type { ElementProps } from "./types";
import { useFormElementToggleContext } from "./FormElementToggleContext";

type Props = PropsWithChildren<ElementProps>;

export const FormElementToggle = (props: Props) => {
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(props.name);
	return (
		<div className="flex gap-2">
			<Toggle
				aria-label="Toggle field"
				data-testid={`${props.name}-toggle`}
				className={
					"z-50 h-auto w-2 min-w-2 rounded-full p-0 data-[state=off]:bg-gray-200 data-[state=on]:bg-gray-400 data-[state=off]:opacity-50"
				}
				pressed={isEnabled}
				onClick={() => formElementToggle.toggle(props.name)}
			/>
			<div className="w-full">{props.children}</div>
		</div>
	);
};
