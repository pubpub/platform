"use client";

import type { PropsWithChildren } from "react";

import type { InputComponent } from "db/public";
import { Toggle } from "ui/toggle";

import type { InputElementProps } from "./types";
import { useFormElementToggleContext } from "./FormElementToggleContext";

type Props<I extends InputComponent> = PropsWithChildren<InputElementProps<I>>;

export const FormElementToggle = <I extends InputComponent>(props: Props<I>) => {
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(props.slug);
	return (
		<div className="flex gap-2">
			<Toggle
				aria-label="Toggle field"
				data-testid={`${props.slug}-toggle`}
				className={
					"z-50 h-auto w-2 min-w-2 rounded-full p-0 data-[state=off]:bg-gray-200 data-[state=on]:bg-gray-400 data-[state=off]:opacity-50"
				}
				pressed={isEnabled}
				onClick={() => formElementToggle.toggle(props.slug)}
			/>
			<div className="w-full">{props.children}</div>
		</div>
	);
};
