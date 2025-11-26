"use client"

import { useState } from "react"

import { Button } from "ui/button"
import { DialogTrigger } from "ui/dialog"
import { Plus } from "ui/icon"

import { CreateEditDialog, Footer } from "~/app/components/CreateEditDialog"
import { FieldForm } from "./FieldForm"

export const NewFieldButton = () => {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<CreateEditDialog
			title="Create New Field"
			onOpenChange={setIsOpen}
			open={isOpen}
			trigger={
				<DialogTrigger asChild>
					<Button className="flex items-center gap-x-2 rounded-md bg-emerald-500 text-white shadow-sm hover:bg-emerald-600">
						<Plus size="16" /> <span>New Field</span>
					</Button>
				</DialogTrigger>
			}
		>
			<FieldForm
				onSubmitSuccess={() => {
					setIsOpen(false)
				}}
			>
				<Footer
					submitText="Create"
					onCancel={() => {
						setIsOpen(false)
					}}
				/>
			</FieldForm>
		</CreateEditDialog>
	)
}
