import type { Communities } from "db/public"

import { useState } from "react"

import { Button } from "ui/button"
import { cn } from "utils"

import { MemberSelectAddUserForm } from "./MemberSelectAddUserForm"

type Props = {
	community: Communities
	email: string
	onUserAdded: () => void
}

export const MemberSelectAddUserButton = (props: Props) => {
	const [open, setOpen] = useState(false)

	return (
		<>
			<Button
				variant="ghost"
				onClick={() => setOpen(true)}
				className={cn(open && "hidden", "h-12 w-full flex-col items-start")}
				data-testid="member-select-add-button"
			>
				<span>Member not found</span>
				<p className="text-xs font-normal">Click to add a user to your community</p>
			</Button>
			{open && (
				<MemberSelectAddUserForm
					email={props.email}
					community={props.community}
					onSubmitSuccess={() => {
						props.onUserAdded()
						setOpen(false)
					}}
				/>
			)}
		</>
	)
}
