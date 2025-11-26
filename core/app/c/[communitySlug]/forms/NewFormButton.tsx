"use client"

import type { PubTypesId } from "db/public"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "ui/button"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogOverlay,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form"
import { Plus } from "ui/icon"
import { Input } from "ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { toast } from "ui/use-toast"

import { useCommunity } from "~/app/components/providers/CommunityProvider"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { createForm } from "./actions"

const schema = z.object({
	pubTypeName: z.string(),
	name: z.string(),
	slug: z.string().regex(/^[a-zA-Z0-9-]+$/, "Only letters, numbers, and hyphens (-) are allowed"),
})

type Props = {
	pubTypes: { id: PubTypesId; name: string }[]
}

export const NewFormButton = ({ pubTypes }: Props) => {
	const [isOpen, setIsOpen] = useState(false)

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	})

	const runCreateForm = useServerAction(createForm)
	const community = useCommunity()

	const onSubmit = async ({ pubTypeName, name, slug }: z.infer<typeof schema>) => {
		const pubTypeId = pubTypes.find((type) => type.name === pubTypeName)?.id
		if (!pubTypeId) {
			toast({
				title: "Error",
				description: `Unable to find pub type ${pubTypeName}`,
				variant: "destructive",
			})
			return
		}
		const result = await runCreateForm(pubTypeId, name, slug, community.id)
		if (didSucceed(result)) {
			toast({
				title: "Success",
				description: "Form created",
			})
			form.reset()
			setIsOpen(false)
		}
	}

	return (
		<Dialog onOpenChange={setIsOpen} defaultOpen={false} open={isOpen} modal={true}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button
					data-testid="new-form-button"
					className="flex items-center gap-x-2 rounded-md bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
				>
					<Plus size="16" /> <span>New Form</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-[20rem] max-w-fit overflow-auto md:min-w-lg">
				<DialogTitle>Create New Form</DialogTitle>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
						<FormField
							control={form.control}
							name="pubTypeName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Select a pub type</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{pubTypes.map((pubType) => (
												<SelectItem
													key={pubType.id}
													value={pubType.name.toString()}
												>
													{pubType.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										Your form will be populated using all fields defined in this
										type, with submitted responses also adopting it.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Form Name</FormLabel>
									<FormControl>
										<Input placeholder="Name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="slug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Slug</FormLabel>
									<FormControl>
										<Input placeholder="slug-example" {...field} />
									</FormControl>
									<FormMessage />
									<FormDescription>
										The URL-friendly identifier for this form. This cannot be
										changed.
									</FormDescription>
								</FormItem>
							)}
						/>
						<DialogFooter className="mt-8 gap-y-1">
							<Button
								onClick={() => {
									form.reset()
									setIsOpen(false)
								}}
								variant="outline"
								type="button"
							>
								Cancel
							</Button>
							<Button type="submit" className="bg-blue-500">
								Create
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
