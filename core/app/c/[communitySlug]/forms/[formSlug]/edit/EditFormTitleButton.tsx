"use client"

import type { FormsId } from "db/public"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "ui/button"
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form"
import { CircleCheck } from "ui/icon"
import { Input } from "ui/input"
import { toast } from "ui/use-toast"

import { didSucceed, useServerAction } from "~/lib/serverActions"
import { updateForm } from "./actions"

const editFormTitleSchema = z.object({
	name: z.string().min(1, "Form name is required"),
})

const EditFormTitleButton = ({ formId, name }: { formId: FormsId; name: string }) => {
	const [isOpen, setIsOpen] = useState(false)

	const form = useForm<z.infer<typeof editFormTitleSchema>>({
		resolver: zodResolver(editFormTitleSchema),
		defaultValues: {
			name,
		},
	})

	const runUpdateFormTitle = useServerAction(updateForm)
	const onSubmit = async (data: z.infer<typeof editFormTitleSchema>) => {
		const result = await runUpdateFormTitle({ formId, name: data.name })
		if (didSucceed(result)) {
			toast.success("Name Successfully Updated")
			setIsOpen(false)
		}
	}
	return (
		<Dialog onOpenChange={setIsOpen} defaultOpen={false} open={isOpen} modal={true}>
			<DialogTrigger asChild>
				<Button
					variant="link"
					className="text-blue-500 text-sm underline hover:text-blue-600"
				>
					Edit
				</Button>
			</DialogTrigger>
			<DialogContent className="flex max-w-[512px] flex-col items-start gap-[24px] p-[24px]">
				<DialogTitle>Edit Name</DialogTitle>
				<div className="w-full border-gray-200 border-t" />
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex w-full flex-col items-start gap-6"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Form Name</FormLabel>
									<FormControl>
										<Input placeholder="Name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className="flex w-full items-center justify-end gap-2">
							<Button
								type="button"
								variant="secondary"
								onClick={() => {
									form.reset()
									setIsOpen(false)
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="default"
								className="bg-[#0090FF] hover:bg-[#0079E3]"
							>
								Update
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

export { EditFormTitleButton }
