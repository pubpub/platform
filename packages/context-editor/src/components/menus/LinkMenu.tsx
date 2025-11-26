import type { Static } from "@sinclair/typebox"
import type { Mark } from "prosemirror-model"

import React, { useMemo } from "react"
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror"
import { typeboxResolver } from "@hookform/resolvers/typebox"
import { Type } from "@sinclair/typebox"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { useForm } from "react-hook-form"
import { registerFormats } from "schemas"

import { Button } from "ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { ExternalLink, Trash } from "ui/icon"
import { Input } from "ui/input"

import { toggleMarkExpandEmpty } from "../../commands/marks"
import { baseSchema } from "../../schemas"
import { MenuSwitchField } from "./MenuFields"

registerFormats()

const formSchema = Type.Object({
	href: Type.String({ format: "uri" }),
	openInNewTab: Type.Boolean({ default: false }),
})

const compiledSchema = TypeCompiler.Compile(formSchema)

type FormSchema = Static<typeof formSchema>

type LinkMenuProps = {
	mark: Mark
	onChange: (values: Record<string, string | null>) => void
}
export const LinkMenu = ({ mark, onChange }: LinkMenuProps) => {
	const removeLink = useEditorEventCallback((view) =>
		toggleMarkExpandEmpty({
			state: view.state,
			dispatch: view.dispatch,
			type: baseSchema.marks.link,
		})
	)

	const resolver = useMemo(() => typeboxResolver(compiledSchema), [])

	const form = useForm<FormSchema>({
		resolver,
		mode: "onBlur",
		defaultValues: {
			href: mark.attrs?.href ?? "",
			openInNewTab: mark.attrs?.target === "_blank",
		},
	})

	const handleSubmit = (values: FormSchema) => {
		const { openInNewTab: _, ...rest } = values
		const attrs = { ...rest, target: values.openInNewTab ? "_blank" : null }
		onChange(attrs)
	}

	if (!(mark.type.name === "link")) {
		return null
	}

	return (
		<Form {...form}>
			{/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: this is a form */}
			<form className="my-2 flex flex-col gap-2" onBlur={form.handleSubmit(handleSubmit)}>
				<FormField
					name="href"
					control={form.control}
					render={({ field }) => {
						return (
							<FormItem className="flex flex-col">
								<div className="flex items-center gap-2 space-y-0">
									<FormLabel>URL</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="url"
											placeholder="https://example.com"
											autoFocus={field.value.length === 0}
										/>
									</FormControl>
									<div className="flex items-center">
										<a
											href={field.value}
											target="_blank"
											className="cursor-pointer text-muted-foreground"
										>
											<ExternalLink strokeWidth="1px" size="20" />
										</a>
										<Button
											className="px-2 text-muted-foreground"
											variant="ghost"
											onClick={removeLink}
											data-testid="remove-link"
										>
											<Trash />
										</Button>
									</div>
								</div>
								<FormMessage />
							</FormItem>
						)
					}}
				/>
				<hr />
				<MenuSwitchField name="openInNewTab" label="Open in new tab" />
			</form>
		</Form>
	)
}
