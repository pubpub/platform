"use client";
import React from "react";
import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTrigger,
	DialogClose,
} from "ui/dialog";
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
import { assign } from "./lib/actions";

type Props = {
	pub: PubPayload;
	stages: StagePayloadMoveConstraintDestination[];
	stage: StagePayload;
	loginData: UserLoginData;
	members: PermissionPayloadMember[];
};

const getTitle = (pub: Props["pub"]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.slug === "unjournal:title";
	});
	return titleValue?.value as string;
};

export default function Assign(props: Props) {
	const { toast } = useToast();
	const onAssign = async (userId: string, stageId: string) => {
		const err = await assign(props.pub.id, userId, stageId);
		if (err) {
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			});
			return;
		}
		toast({
			title: "Success",
			description: "User was succesfully assigned.",
			variant: "default",
		});
	};

	return (
		<>
			<Popover>
				<PopoverTrigger asChild>
					<Button size="sm" variant="outline" className="ml-1">
						Assign
					</Button>
				</PopoverTrigger>
				<PopoverContent className="flex flex-col">
					{props.members
						.slice()
						.sort((member) => (member.user.id === props.loginData.id ? -1 : 1))
						.map((member) => {
							const intials = member.user.lastName
								? `${member.user.firstName[0]} ${member.user.lastName[0]}`
								: `${member.user.firstName[0]}`;
							return (
								<Dialog>
									<DialogTrigger>
										<div className="flex flex-row content-center">
											<Avatar className="rounded w-9 h-9 mr-2">
												<AvatarFallback>{intials}</AvatarFallback>
											</Avatar>
											<p>
												{member.user.firstName} {member.user.lastName}
											</p>
										</div>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											Assign <em>{getTitle(props.pub)}</em> to{" "}
											{member.user.firstName} {member.user.lastName}?
										</DialogHeader>
										<p>
											{member.user.firstName} {member.user.lastName} will be
											notified that they have been assigned to this Pub.
										</p>
										<DialogFooter className="sm:justify-between">
											<DialogClose asChild>
												<Button type="button" variant="secondary">
													Close
												</Button>
											</DialogClose>
											<Button
												variant="default"
												onClick={(event) => {
													onAssign(member.user.id, props.stage.id);
													event.preventDefault();
												}}
											>
												Assign
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							);
						})}
				</PopoverContent>
			</Popover>
		</>
	);
}
