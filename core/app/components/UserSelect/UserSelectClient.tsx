"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { AutoComplete, Option } from "ui/autocomplete";
import { Button } from "ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { TooltipProvider } from "ui/tooltip";

import { Users } from "~/kysely/types/public/Users";
import cn from "~/lib/cn";
import { UserAvatar } from "../UserAvatar";
import { UserSelectAddUser } from "./UserSelectAddUser";

const makeOptionFromUser = (user: Users): Option => ({
	value: user.id,
	label: user.email,
	node: (
		<div className="flex flex-col">
			<span>
				{user.firstName} {user.lastName}
			</span>
			<address className="text-xs not-italic text-muted-foreground">{user.email}</address>
		</div>
	),
});

type Props = { user?: Users; users: Users[]; fieldName: string; fieldLabel: string };

const UserSelectAddUserButton = () => {
	const [open, setOpen] = useState(false);

	const onClick = useCallback((e) => {
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
			{open && <UserSelectAddUser />}
		</>
	);
};

export function UserSelectClient({ user, users, fieldName, fieldLabel }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const options = useMemo(() => users.map(makeOptionFromUser), [users]);
	const previouslyFetchedUsers = useRef<Map<string, Users>>();

	useEffect(() => {
		if (previouslyFetchedUsers.current === undefined) {
			previouslyFetchedUsers.current = new Map(users.map((user) => [user.id, user]));
		} else {
			for (const user of users) {
				previouslyFetchedUsers.current.set(user.id, user);
			}
		}
	}, [users]);

	const onInputValueChange = useDebouncedCallback((value: string) => {
		const newParams = new URLSearchParams(params);
		newParams.set("query", value);
		router.replace(`${pathname}?${newParams.toString()}`);
	}, 400);

	// Force a re-mount of the <UserSelectAddUserButton> element when the
	// autocomplete dropdown is closed.
	const [addUserButtonKey, setAddUserButtonKey] = useState(0);
	const addUserButton = <UserSelectAddUserButton key={addUserButtonKey} />;
	const resetAddUserButton = useCallback(() => setAddUserButtonKey((x) => x + 1), []);

	// User selection state/logic.
	const [selectedUser, setSelectedUser] = useState(user);
	const selectUserOption = useCallback((option: Option) => {
		const user = previouslyFetchedUsers.current?.get(option.value);
		if (user) {
			setSelectedUser(user);
		}
	}, []);

	return (
		<TooltipProvider>
			<FormField
				name={fieldName}
				render={({ field }) => {
					const selectedUserOption = selectedUser
						? makeOptionFromUser(selectedUser)
						: undefined;
					return (
						<FormItem className="flex flex-col gap-y-1">
							<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
								{fieldLabel}
							</FormLabel>
							<AutoComplete
								value={selectedUserOption}
								options={options}
								empty={addUserButton}
								onInputValueChange={onInputValueChange}
								onValueChange={(option) => {
									field.onChange(option.value);
									selectUserOption(option);
								}}
								onClose={resetAddUserButton}
								icon={selectedUser ? <UserAvatar user={selectedUser} /> : null}
							/>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
		</TooltipProvider>
	);
}
