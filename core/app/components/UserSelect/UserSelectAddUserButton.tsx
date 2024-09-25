import { useCallback, useState } from "react";

import type { Communities } from "db/public";
import { Button } from "ui/button";
import { cn } from "utils";

import { UserSelectAddUserForm } from "./UserSelectAddUserForm";

type Props = {
	community: Communities;
	email: string;
};

export const UserSelectAddUserButton = (props: Props) => {
	const [open, setOpen] = useState(false);

	const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		setOpen(true);
	}, []);

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
			{open && <UserSelectAddUserForm email={props.email} community={props.community} />}
		</>
	);
};
