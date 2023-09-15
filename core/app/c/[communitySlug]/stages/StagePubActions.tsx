"use client";
import React from "react";
import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardTitle,
	Dialog,
	DialogContent,
	DialogTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	useToast,
} from "ui";
import {
	PermissionPayloadUser,
	PubPayload,
	StagePayload,
	StagePayloadMoveConstraintDestination,
	User,
} from "~/lib/types";
import Image from "next/image";
import { assign, move } from "./actions";

type Props = {
	users: PermissionPayloadUser[];
	pub: PubPayload;
	stages: StagePayloadMoveConstraintDestination[];
	stage: StagePayload;
	loginData: User;
};

const getTitle = (pub: Props["pub"]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	return titleValue?.value as string;
};

export const StagePubActions = (props: Props) => {
	const { users, pub, stage, loginData, stages } = props;
	const [open, setOpen] = React.useState(false);
	const [selectedUserId, setSelectedUserid] = React.useState("");
	const { toast } = useToast();

	const onAssign = async (pubId: string, userId: string, stageId: string) => {
		const err = await assign(pubId, userId, stageId);
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

	const onMove = async (pubId: string, sourceStageId: string, destStageId: string) => {
		const err = await move(pubId, sourceStageId, destStageId);
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
			description: "Pub was successfully moved",
			variant: "default",
		});
	};

	return (
		<div className="flex items-end shrink-0">
			<Popover>
				<PopoverTrigger asChild>
					<Button size="sm" variant="outline" className="ml-1">
						Move
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<div className="flex flex-col">
						<div className="mb-4">
							<b>Move this pub to:</b>
						</div>
						{stages.map((s) => {
							return s.id === stage.id ? null : (
								<Button
									variant="ghost"
									key={s.name}
									onClick={() => onMove(pub.id, stage.id, s.id)}
								>
									{s.name}
								</Button>
							);
						})}
					</div>
				</PopoverContent>
			</Popover>
			<Popover>
				<PopoverTrigger asChild>
					<Button size="sm" variant="outline" className="ml-1">
						Assign
					</Button>
				</PopoverTrigger>
				<PopoverContent className="flex flex-col">
					<Button
						variant="secondary"
						className="mb-5"
						onClick={() => onAssign(pub.id, loginData.id, stage.id)}
					>
						Claim
					</Button>
					{users.map((user) => {
						return (
							<Dialog
								open={open && selectedUserId === user.id}
								onOpenChange={setOpen}
								key={user.id}
							>
								<DialogTrigger>
									<Button
										variant="ghost"
										onClick={() => setSelectedUserid(user.id)}
									>
										<div className="mr-4">
											<Image
												src={user.avatar ?? "user.initials"}
												alt={"user.initials"}
												width={20}
												height={20}
											/>
										</div>
										<span>{user.name}</span>
									</Button>
								</DialogTrigger>
								<DialogContent>
									<Card>
										<CardTitle className="space-y-1.5 p-6">
											Assign <i>{getTitle(pub)}</i> to {user.name}?
										</CardTitle>
										<CardContent>
											{user.name} will be notified that they have been
											assigned to this Pub.
										</CardContent>
										<CardFooter className="flex flex-row">
											<Button
												variant="default"
												onClick={(event) => {
													onAssign(pub.id, user.id, stage.id).then(() =>
														setOpen(false)
													);
													event.preventDefault();
												}}
											>
												Assign
											</Button>
											<Button
												className="mx-3"
												variant="secondary"
												onClick={() => setOpen(false)}
											>
												Cancel
											</Button>
										</CardFooter>
									</Card>
								</DialogContent>
							</Dialog>
						);
					})}
				</PopoverContent>
			</Popover>

			<Button size="sm" variant="outline" className="ml-1">
				Email Members
			</Button>
		</div>
	);
};
