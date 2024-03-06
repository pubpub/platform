"use client";
import React, { useEffect, useState } from "react";
import { Button } from "ui/button";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { useToast } from "ui/use-toast";
import { Avatar, AvatarFallback } from "ui/avatar";
import {
	PermissionPayloadMember,
	PubPayload,
	StagePayload,
	StagePayloadMoveConstraintDestination,
	UserLoginData,
} from "~/lib/types";
import { assign, unassign } from "./lib/actions";
import { Check, Loader2 } from "ui/icon";
import { cn } from "utils";

type Props = {
	pub: PubPayload;
	stages: StagePayloadMoveConstraintDestination[];
	stage: StagePayload;
	loginData: UserLoginData;
	members: PermissionPayloadMember[];
};

export default function Assign(props: Props) {
	const { toast } = useToast();
	const [userId, setUser] = React.useState<string>("");
	const [open, setOpen] = React.useState<boolean>(false);
	const [isLoading, setLoading] = useState<boolean>(false);
	const [claimId, setClaimId] = useState<string>("");

	useEffect(() => {
		// set userId to who has claim on pub
		const claim = props.pub.claims[0];
		if (claim) {
			setClaimId(claim.id);
			setUser(claim.userId);
		}
	}, [props.pub.claims, props.stage.id]);

	const handleAssign = async (
		doWhat: boolean,
		userId?: string,
		stageId?: string,
		claimId?: string
	) => {
		const res = doWhat
			? await assign(props.pub.id, userId!, stageId!)
			: await unassign(props.pub.id, claimId!);

		if ("error" in res && typeof res.error === "string") {
			toast({
				title: "Error",
				description: res.error,
				variant: "destructive",
			});
			return;
		}
		toast({
			title: "Success",
			description: res.message,
			variant: "default",
		});
	};

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button size="sm" variant="outline" role="combobox">
						{userId
							? props.members.find((member) => member.user.id === userId)?.user
									.firstName
							: "Assign"}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						{/* <CommandInput placeholder="Search members..." /> would be useful in a future of pagination and member search*/}
						<CommandEmpty>No framework found.</CommandEmpty>
						<CommandGroup>
							{props.members
								.slice()
								.sort((member) => (member.user.id === props.loginData.id ? -1 : 1))
								.map((member) => {
									const intials = member.user.lastName
										? `${member.user.firstName[0]} ${member.user.lastName[0]}`
										: `${member.user.firstName[0]}`;
									return (
										<CommandItem
											key={member.id}
											value={member.user.id}
											onSelect={(currentUserId) => {
												setLoading(true);
												// if nothing is selected, assign the userId
												if (!userId) {
													handleAssign(
														true,
														member.user.id,
														props.stage.id
													);
												}
												// if the currentvalue is the same, unassign the userId
												if (currentUserId === userId) {
													handleAssign(
														false,
														member.user.id,
														props.stage.id
													);
												}
												// if the currentvalue is different but a userId exist, unassign the previous userId, assign the currentuser
												if (currentUserId !== userId && userId) {
													handleAssign(false, userId, claimId);
													handleAssign(
														true,
														member.user.id,
														props.stage.id
													);
												}
												setUser(
													currentUserId === userId ? "" : currentUserId
												);
												setLoading(false);
												setOpen(false);
											}}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													userId === member.user.id
														? "opacity-100"
														: "opacity-0"
												)}
											/>
											<div className="flex flex-row items-center">
												<Avatar className="rounded w-9 h-9 mr-2">
													<AvatarFallback>{intials}</AvatarFallback>
												</Avatar>
												<p>
													{member.user.firstName} {member.user.lastName}
												</p>
											</div>
											{isLoading && (
												<Loader2 className="h-4 w-4 ml-4 animate-spin" />
											)}
										</CommandItem>
									);
								})}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		</>
	);
}
