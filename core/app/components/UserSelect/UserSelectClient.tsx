"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

import { AutoComplete, Option } from "ui/autocomplete";
import { FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { TooltipProvider } from "ui/tooltip";

import { Communities } from "~/kysely/types/public/Communities";
import { Users } from "~/kysely/types/public/Users";
import { UserAvatar } from "../UserAvatar";
import { UserSelectAddUserButton } from "./UserSelectAddUserButton";

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

type Props = {
	user?: Users;
	users: Users[];
	fieldName: string;
	fieldLabel: string;
	community: Communities;
	queryParamName: string;
};

export function UserSelectClient({
	queryParamName,
	user,
	users,
	fieldName,
	fieldLabel,
	community,
}: Props) {
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

	// Force a re-mount of the <UserSelectAddUserButton> element when the
	// autocomplete dropdown is closed.
	const [addUserButtonKey, setAddUserButtonKey] = useState(0);
	const resetAddUserButton = useCallback(() => setAddUserButtonKey((x) => x + 1), []);

	// User selection state/logic.
	const [selectedUser, setSelectedUser] = useState(user);
	const selectUserOption = useCallback((option: Option) => {
		const user = previouslyFetchedUsers.current?.get(option.value);
		if (user) {
			setSelectedUser(user);
		}
	}, []);

	const [inputValue, setInputValue] = useState(selectedUser?.email ?? "");
	const onInputValueChange = useDebouncedCallback((value: string) => {
		const newParams = new URLSearchParams(params);
		newParams.set(queryParamName, value);
		router.replace(`${pathname}?${newParams.toString()}`);
		setInputValue(value);
	}, 400);

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
								empty={
									<UserSelectAddUserButton
										key={addUserButtonKey}
										community={community}
										email={inputValue}
									/>
								}
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
