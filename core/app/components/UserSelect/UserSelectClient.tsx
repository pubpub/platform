"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import type { Communities } from "db/public/Communities";
import type { Users } from "db/public/Users";
import type { Option } from "ui/autocomplete";
import CoreSchemaType from "db/public/CoreSchemaType";
import { AutoComplete } from "ui/autocomplete";
import { FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import {
	PubFieldSelector,
	PubFieldSelectorHider,
	PubFieldSelectorProvider,
	PubFieldSelectorToggleButton,
} from "ui/pubFields";

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
	community: Communities;
	fieldLabel: string;
	fieldName: string;
	queryParamName: string;
	user?: Users;
	users: Users[];
};

export function UserSelectClient({
	community,
	fieldLabel,
	fieldName,
	queryParamName,
	user,
	users,
}: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const options = useMemo(() => users.map(makeOptionFromUser), [users]);

	// Force a re-mount of the <UserSelectAddUserButton> element when the
	// autocomplete dropdown is closed.
	const [addUserButtonKey, setAddUserButtonKey] = useState(0);
	const resetAddUserButton = useCallback(() => {
		// clear search param
		const newParams = new URLSearchParams(params);
		newParams.delete(queryParamName);
		router.replace(`${pathname}?${newParams.toString()}`);

		setAddUserButtonKey((x) => x + 1);
	}, []);

	// User selection state/logic.
	const [selectedUser, setSelectedUser] = useState(user);
	const selectUserOption = useCallback(
		(option: Option) => {
			const user = users.find((user) => user.id === option.value);
			if (user) {
				setSelectedUser(user);
			}
		},
		[users]
	);

	const [inputValue, setInputValue] = useState(selectedUser?.email ?? "");
	const onInputValueChange = useDebouncedCallback((value: string) => {
		const newParams = new URLSearchParams(params);
		newParams.set(queryParamName, value);
		router.replace(`${pathname}?${newParams.toString()}`);
		setInputValue(value);
	}, 400);

	return (
		<FormField
			name={fieldName}
			render={({ field }) => {
				const selectedUserOption = selectedUser
					? makeOptionFromUser(selectedUser)
					: undefined;
				return (
					<PubFieldSelectorProvider
						field={field}
						allowedSchemas={[CoreSchemaType.UserId]}
					>
						<FormItem className="flex flex-col gap-y-1">
							<div className="flex items-center justify-between">
								<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
									{fieldLabel}
								</FormLabel>
								<PubFieldSelectorToggleButton />
							</div>
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
							<PubFieldSelectorHider>
								<PubFieldSelector />
							</PubFieldSelectorHider>
						</FormItem>
					</PubFieldSelectorProvider>
				);
			}}
		/>
	);
}
