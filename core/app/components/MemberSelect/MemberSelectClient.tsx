"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import type { Communities } from "db/public";
import type { Option } from "ui/autocomplete";
import { CoreSchemaType, MemberRole } from "db/public";
import { AutoComplete } from "ui/autocomplete";
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { UserCheck } from "ui/icon";
import {
	PubFieldSelector,
	PubFieldSelectorHider,
	PubFieldSelectorProvider,
	PubFieldSelectorToggleButton,
} from "ui/pubFields";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";
import { cn, expect } from "utils";

import type { MemberSelectUser, MemberSelectUserWithMembership } from "./types";
import { addMember } from "~/app/c/[communitySlug]/members/actions";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { useFormElementToggleContext } from "../forms/FormElementToggleContext";
import { UserAvatar } from "../UserAvatar";
import { MemberSelectAddUserButton } from "./MemberSelectAddUserButton";
import { isMemberSelectUserWithMembership } from "./types";

const makeOptionFromUser = (user: MemberSelectUser): Option => ({
	value: user.id,
	label: user.email,
	node: (
		<TooltipProvider>
			<div className="flex flex-1 flex-row items-center">
				<div className="flex flex-1 flex-col">
					<span>
						{user.firstName} {user.lastName}
					</span>
					<address className="text-xs not-italic text-muted-foreground">
						{user.email}
					</address>
				</div>
				<Tooltip>
					<TooltipTrigger>
						{user.member && <UserCheck size={18} className="text-gray-600" />}
					</TooltipTrigger>
					<TooltipContent>This user is a member of your community.</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	),
});

type Props = {
	community: Communities;
	name: string;
	member?: MemberSelectUserWithMembership;
	users: MemberSelectUser[];
	onChange: (search: string) => void;
	onUserAdded: () => void;
};

export function MemberSelectClient({
	community,
	name,
	member,
	users,
	onChange,
	onUserAdded,
}: Props) {
	const options = useMemo(() => users.map(makeOptionFromUser), [users]);
	const runAddMember = useServerAction(addMember);
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(name);

	// Force a re-mount of the <UserSelectAddUserButton> element when the
	// autocomplete dropdown is closed.
	const [addUserButtonKey, setAddUserButtonKey] = useState(0);
	const resetAddUserButton = useCallback(() => {
		setAddUserButtonKey((x) => x + 1);
	}, []);

	const [selectedUser, setSelectedUser] = useState(member);

	const [inputValue, setInputValue] = useState(selectedUser?.email ?? "");

	const updateSearch = useDebouncedCallback((value: string) => {
		onChange(value);
	}, 400);

	const onInputValueChange = (value: string) => {
		setInputValue(value);
		updateSearch(value);
	};

	return (
		<FormField
			name={name}
			render={({ field }) => {
				const unsetUser = () => {
					setSelectedUser(undefined);
					field.onChange(undefined);
				};
				const selectedUserOption = selectedUser && makeOptionFromUser(selectedUser);
				return (
					<AutoComplete
						name={name}
						value={selectedUserOption}
						options={options}
						disabled={!isEnabled}
						empty={
							<MemberSelectAddUserButton
								key={addUserButtonKey}
								community={community}
								email={inputValue}
								onUserAdded={onUserAdded}
							/>
						}
						onInputValueChange={(val) => {
							if (val === "") {
								unsetUser();
							}
							onInputValueChange(val);
						}}
						onValueChange={async (option) => {
							const user = users.find((user) => user.id === option.value);
							if (!user) {
								return;
							}
							if (isMemberSelectUserWithMembership(user)) {
								setSelectedUser(user);
								field.onChange(user.member.id);
							} else {
								const result = await runAddMember({
									userId: user.id,
									role: MemberRole.contributor,
									forms: [],
								});
								if (didSucceed(result)) {
									const member = expect(result.member);
									setSelectedUser({ ...user, member });
									field.onChange(member.id);
								}
							}
						}}
						onClose={resetAddUserButton}
						icon={selectedUser ? <UserAvatar user={selectedUser} /> : null}
						onClear={selectedUser ? unsetUser : undefined}
					/>
				);
			}}
		/>
	);
}
