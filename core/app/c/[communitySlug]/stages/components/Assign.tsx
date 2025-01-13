"use client"

import React, { useCallback, useMemo } from "react"

import type { ProcessedPub } from "contracts"
import type { PubsId, UsersId } from "db/public"
import { Button } from "ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "ui/command"
import { Check, ChevronsUpDown } from "ui/icon"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
import { useToast } from "ui/use-toast"
import { cn, expect } from "utils"

import type { MemberWithUser } from "~/lib/types"
import { getPubTitle } from "~/lib/pubs"
import { useServerAction } from "~/lib/serverActions"
import { assign } from "./lib/actions"

type Props = {
	members: MemberWithUser[]
	pub: ProcessedPub<{
		withPubType: true
		withLegacyAssignee: true
		withRelatedValues: false
		withChildren: undefined
	}>
}

export default function Assign(props: Props) {
	const { toast } = useToast()
	const [open, setOpen] = React.useState(false)
	const [selectedUserId, setSelectedUserId] = React.useState<string | undefined>(
		props.pub.assignee?.id ?? undefined
	)
	const title = useMemo(() => getPubTitle(props.pub), [props.pub])
	const users = useMemo(() => props.members.map((member) => member.user), [props.members])
	const user = useMemo(
		() => users.find((user) => user.id === selectedUserId),
		[users, selectedUserId]
	)

	const runAssign = useServerAction(assign)

	const onAssign = useCallback(
		async (pubId: PubsId, userId?: UsersId) => {
			const error = await runAssign(pubId, userId)
			if (userId) {
				const user = expect(users.find((user) => user.id === userId))
				toast({
					title: "Success",
					description: (
						<>
							{user.firstName} was assigned to <em>{title}</em>.
						</>
					),
					variant: "default",
				})
			} else {
				toast({
					title: "Success",
					description: (
						<>
							<em>{title}</em> was unassigned.
						</>
					),
					variant: "default",
				})
			}
		},
		[users]
	)

	const onSelect = useCallback(
		(value: string) => {
			const userId = value === selectedUserId ? undefined : value
			setSelectedUserId(userId)
			onAssign(props.pub.id, userId as UsersId)
			setOpen(false)
		},
		[selectedUserId, props.pub.id, onAssign]
	)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					role="combobox"
					name="Assign"
					aria-expanded={open}
					className="w-[150px] justify-between"
				>
					<span className="truncate">
						{user ? `${user.firstName} ${user.lastName}` : "Assign"}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput className="my-2 h-8" placeholder="Search member..." />
					<CommandEmpty>No member found.</CommandEmpty>
					<CommandList>
						<CommandGroup>
							{users.map((user) => {
								const keywords = [user.firstName]
								if (user.lastName) {
									keywords.push(user.lastName)
								}
								return (
									<CommandItem
										key={user.id}
										value={user.id}
										keywords={keywords}
										onSelect={onSelect}
									>
										{user.firstName} {user.lastName}
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												selectedUserId === user.id
													? "opacity-100"
													: "opacity-0"
											)}
										/>
									</CommandItem>
								)
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
