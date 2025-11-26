"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "ui/button"
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { Loader2 } from "ui/icon"
import { Input } from "ui/input"
import { toast } from "ui/use-toast"

import { didSucceed, useServerAction } from "~/lib/serverActions"
import { createCommunity } from "./actions"

export const communityCreateFormSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	avatar: z.string().url().optional().or(z.literal("")),
})

type Props = {
	setOpen: (open: false) => void
}

export const AddCommunityForm = (props: Props) => {
	const runCreateCommunity = useServerAction(createCommunity)

	async function onSubmit(data: z.infer<typeof communityCreateFormSchema>) {
		const result = await runCreateCommunity({ ...data })
		if (didSucceed(result)) {
			props.setOpen(false)
			toast.success("Community created")
		}
	}
	const form = useForm<z.infer<typeof communityCreateFormSchema>>({
		resolver: zodResolver(communityCreateFormSchema),
		defaultValues: {
			name: "",
			slug: "",
			avatar: "",
		},
	})

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<Input {...field} />
							<FormDescription>What is the name of your community</FormDescription>
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
							<Input {...field} />
							<FormDescription>
								Name the string you want your community to route to
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="avatar"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Avatar</FormLabel>
							<Input {...field} />
							<FormDescription>
								What is the url path to the avatar for your community (optional)
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? (
						<Loader2 />
					) : (
						<div className="flex items-center gap-x-2">Create Community</div>
					)}
				</Button>
			</form>
		</Form>
	)
}
