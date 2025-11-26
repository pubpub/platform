"use client"

import type { PropsWithChildren } from "react"

import { Toggle } from "ui/toggle"

import { useFormElementToggleContext } from "./FormElementToggleContext"

export const FormElementToggle = (props: PropsWithChildren<{ slug: string }>) => {
	const formElementToggle = useFormElementToggleContext()
	const isEnabled = formElementToggle.isEnabled(props.slug)
	return (
		<div className="flex gap-2">
			<Toggle
				aria-label="Toggle field"
				data-testid={`${props.slug}-toggle`}
				className={
					"z-50 h-auto w-2 min-w-2 rounded-full p-0 data-[state=off]:bg-border data-[state=on]:bg-accent data-[state=off]:opacity-50"
				}
				pressed={isEnabled}
				onClick={() => formElementToggle.toggle(props.slug)}
			/>
			<div className="w-full">{props.children}</div>
		</div>
	)
}
