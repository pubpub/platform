"use client"

<<<<<<< HEAD
import { memo, useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
=======
import type { Communities, CommunityMembershipsId } from "db/public"
import type { Option } from "ui/autocomplete"
import type { MemberSelectUser, MemberSelectUserWithMembership } from "./types"
>>>>>>> main

import { useCallback, useMemo, useState } from "react"
import { useDebouncedCallback } from "use-debounce"

import { MemberRole } from "db/public"
import { AutoComplete } from "ui/autocomplete"
import { UserCheck } from "ui/icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip"
import { expect } from "utils"

import { addMember } from "~/app/c/[communitySlug]/members/actions"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { useFormElementToggleContext } from "../forms/FormElementToggleContext"
import { UserAvatar } from "../UserAvatar"
import { MemberSelectAddUserButton } from "./MemberSelectAddUserButton"
import { isMemberSelectUserWithMembership } from "./types"

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
					<address className="text-muted-foreground text-xs not-italic">
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
})

type Props = {
	community: Communities
	name: string
	member?: MemberSelectUserWithMembership
	users: MemberSelectUser[]
	onChangeSearch: (search: string) => void
	onChangeValue: (value: CommunityMembershipsId | undefined) => void
	onUserAdded: () => void
}

export const MemberSelectClient = memo(
	function MemberSelectClient({
		community,
		name,
		member,
		users,
		onChangeSearch,
		onChangeValue,
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
			onChangeSearch(value);
		}, 400);

		const onInputValueChange = (value: string) => {
			setInputValue(value);
			updateSearch(value);
		};

		const unsetUser = () => {
			setSelectedUser(undefined);
			onChangeValue(undefined);
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
						onChangeValue(user.member.id);
					} else {
						const result = await runAddMember({
							userId: user.id,
							role: MemberRole.contributor,
							forms: [],
						});
						if (didSucceed(result)) {
							const member = expect(result.member);
							setSelectedUser({ ...user, member });
							onChangeValue(member.id);
						}
					}
				}}
				onClose={resetAddUserButton}
				icon={selectedUser ? <UserAvatar user={selectedUser} /> : null}
				onClear={selectedUser ? unsetUser : undefined}
			/>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.name === nextProps.name &&
			prevProps.member?.id === nextProps.member?.id &&
			prevProps.users === nextProps.users
		);
	}
);
