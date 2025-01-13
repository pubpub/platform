import { useCallback, useState } from "react"

import type { Communities } from "db/public"
import { Button } from "ui/button"
import { cn } from "utils"

import { MemberSelectAddUserForm } from "./MemberSelectAddUserForm"

type Props = {
	community: Communities
	email: string
}

export const MemberSelectAddUserButton = (props: Props) => {
	const [open, setOpen] = useState(false)

	const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		setOpen(true)
	}, [])

	return (
		<>
			<Button
				variant="ghost"
				onClick={onClick}
				className={cn(open && "hidden", "h-12 w-full flex-col items-start")}
			>
				<span>Member not found</span>
				<p className="text-xs font-normal">Click to add a user to your community</p>
			</Button>
			{open && <MemberSelectAddUserForm email={props.email} community={props.community} />}
		</>
	)
}
