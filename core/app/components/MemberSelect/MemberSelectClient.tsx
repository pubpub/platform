"use client";

import assert from "assert";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { addMember } from "~/app/c/[communitySlug]/members/[[...add]]/actions";
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
	fieldLabel: string;
	fieldName: string;
	queryParamName: string;
	helpText?: string;
	member?: MemberSelectUserWithMembership;
	users: MemberSelectUser[];
	allowPubFieldSubstitution: boolean;
};

export function MemberSelectClient({
	community,
	fieldLabel,
	fieldName,
	queryParamName,
	member,
	users,
	allowPubFieldSubstitution,
	helpText,
}: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const options = useMemo(() => users.map(makeOptionFromUser), [users]);
	const runAddMember = useServerAction(addMember);
	const formElementToggle = useFormElementToggleContext();
	const isEnabled = formElementToggle.isEnabled(fieldName);

	// Force a re-mount of the <UserSelectAddUserButton> element when the
	// autocomplete dropdown is closed.
	const [addUserButtonKey, setAddUserButtonKey] = useState(0);
	const resetAddUserButton = useCallback(() => {
		setAddUserButtonKey((x) => x + 1);
	}, []);

	const [selectedUser, setSelectedUser] = useState(member);

	const [inputValue, setInputValue] = useState(selectedUser?.email ?? "");

	const onInputValueChange = useDebouncedCallback((value: string) => {
		const newParams = new URLSearchParams(params);
		const oldParams = newParams.toString();
		newParams.set(queryParamName, value);
		// Only change params when they are different, otherwise can cause race conditions
		// if another component is trying to change the query params as well
		if (oldParams !== newParams.toString()) {
			router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
		}
		setInputValue(value);
	}, 400);

	return (
		<FormField
			name={fieldName}
			render={({ field }) => {
				const selectedUserOption = selectedUser && makeOptionFromUser(selectedUser);
				const formItem = (
					<FormItem className="flex flex-col gap-y-1">
						<div className="flex items-center justify-between">
							<FormLabel
								className={cn(
									"text-sm font-medium leading-none",
									!isEnabled && "cursor-not-allowed opacity-50"
								)}
							>
								{fieldLabel}
							</FormLabel>
							{allowPubFieldSubstitution && <PubFieldSelectorToggleButton />}
						</div>
						<AutoComplete
							name={fieldName}
							value={selectedUserOption}
							options={options}
							disabled={!isEnabled}
							empty={
								<MemberSelectAddUserButton
									key={addUserButtonKey}
									community={community}
									email={inputValue}
								/>
							}
							onInputValueChange={onInputValueChange}
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
										user,
										role: MemberRole.contributor,
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
						/>
						<FormMessage />
						{helpText && <FormDescription>{helpText}</FormDescription>}
						{allowPubFieldSubstitution && (
							<PubFieldSelectorHider>
								<PubFieldSelector />
							</PubFieldSelectorHider>
						)}
					</FormItem>
				);
				return allowPubFieldSubstitution ? (
					<PubFieldSelectorProvider
						field={field}
						allowedSchemas={[CoreSchemaType.MemberId]}
					>
						{formItem}
					</PubFieldSelectorProvider>
				) : (
					formItem
				);
			}}
		/>
	);
}
