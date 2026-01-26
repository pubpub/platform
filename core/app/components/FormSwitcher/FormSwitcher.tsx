"use client"

import type { SimpleForm } from "~/lib/server/form"

import { parseAsString, useQueryState } from "nuqs"

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from "ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"
import { cn } from "utils"

export const formSwitcherUrlParam = "form"

export const FormSwitcher = ({
	forms,
	defaultFormSlug,
	htmlId,
	className,
	children,
}: {
	forms: SimpleForm[]
	defaultFormSlug?: string
	htmlId?: string
	className?: string
	children?: React.ReactNode
}) => {
	const [selectedFormSlug, setSelectedFormSlug] = useQueryState(
		formSwitcherUrlParam,
		parseAsString.withDefault(defaultFormSlug ?? "").withOptions({
			shallow: false,
		})
	)

	if (!forms.length) {
		return null
	}

	const currentForm = forms.find((form) => form.slug === selectedFormSlug)

	return (
		<Select
			onValueChange={(slug: string) => {
				setSelectedFormSlug(slug)
			}}
			defaultValue={selectedFormSlug || defaultFormSlug}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<SelectTrigger
						id={htmlId}
						className={cn(
							"flex h-6 items-center gap-1 border-none bg-transparent!",
							className
						)}
					>
						{children}
						<span className="inline-block truncate">{currentForm?.name}</span>
					</SelectTrigger>
				</TooltipTrigger>

				<TooltipContent>
					Viewing as <em>{currentForm?.name}</em>
				</TooltipContent>
			</Tooltip>
			<SelectContent>
				<SelectGroup>
					<SelectLabel className="font-normal text-muted-foreground text-xs">
						Content will change upon selection. You may lose unsaved changes.
					</SelectLabel>
					{forms.map((form) => (
						<SelectItem key={form.id} value={form.slug}>
							{form.name}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	)
}
