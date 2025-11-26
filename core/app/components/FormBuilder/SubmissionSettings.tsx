import type { FormBuilderSchema } from "./types"

import { useMemo } from "react"
import { useFormContext } from "react-hook-form"

import { Button } from "ui/button"
import { FormLabel } from "ui/form"
import { FormInput, Pencil, Plus } from "ui/icon"
import { cn } from "utils"

import { useBuilder } from "./BuilderContext"
import { isButtonElement } from "./types"

export const ButtonOption = ({
	label,
	id,
	readOnly,
}: {
	label: string
	id?: string
	readOnly?: boolean
}) => {
	// TODO: need a way to determine if button is primary or secondary
	const buttonType: string = "primary"
	const { openButtonConfigPanel } = useBuilder()
	const handleClick = () => {
		openButtonConfigPanel(id ?? label)
	}
	return (
		// overflow-hidden to keep the div that is only a color inside the border radius
		<div
			data-testid={`button-option-${label}`}
			className="relative flex w-full items-center justify-between overflow-hidden rounded-sm border"
		>
			<div
				className={cn("absolute h-full w-4 bg-foreground", {
					"bg-muted-foreground": buttonType === "secondary",
				})}
			></div>
			<div className="ml-7 flex items-center gap-3">
				<FormInput width="20px" />
				<div className="flex h-full flex-col py-3">
					<span className="font-medium text-muted-foreground text-sm">
						{buttonType === "primary" ? "Primary Button" : "Secondary Button"}
					</span>
					<span className="font-semibold">{label}</span>
				</div>
			</div>
			{!readOnly ? (
				<Button
					data-testid="edit-button"
					onClick={handleClick}
					variant="ghost"
					className="mr-2 p-2"
				>
					<span className="sr-only">Edit</span>
					<Pencil className="text-neutral-500" />
				</Button>
			) : null}
		</div>
	)
}

export const SubmissionSettings = () => {
	const { openButtonConfigPanel } = useBuilder()
	// This uses the parent's form context to get the most up to date version of 'elements'
	const { getValues } = useFormContext<FormBuilderSchema>()
	const buttons = useMemo(() => {
		const elements = getValues().elements
		return elements.filter((e) => isButtonElement(e))
	}, [getValues])
	const showAddButton = buttons.length < 2
	const handleAddNew = () => {
		openButtonConfigPanel()
	}

	return (
		<div>
			<FormLabel className="text-gray-500 text-sm uppercase">Submission Settings</FormLabel>
			<hr className="my-2" />
			<div className="flex flex-col items-start gap-3">
				{buttons.map((b) => {
					return <ButtonOption id={b.elementId} key={b.label} label={b.label} />
				})}
				{showAddButton ? (
					<Button
						onClick={handleAddNew}
						variant="link"
						size="sm"
						className="p-0 text-blue-500"
						data-testid="add-submission-settings-button"
					>
						<Plus width="12px" className="mr-1" /> Add Button
					</Button>
				) : null}
			</div>
		</div>
	)
}
