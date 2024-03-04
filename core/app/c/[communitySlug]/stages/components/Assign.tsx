"use client";
import Image from "next/image";
import React from "react";
import { Button } from "ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "ui/card";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { useToast } from "ui/use-toast";

import {
	PermissionPayloadUser,
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
	users: PermissionPayloadUser[];
};

const getTitle = (pub: Props["pub"]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.slug === "unjournal:title";
	});
	return titleValue?.value as string;
};

export default function Assign(props: Props) {
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
	return (
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
					onClick={() => onAssign(props.pub.id, props.loginData.id, props.stage.id)}
				>
					Claim
				</Button>
				{props.users.map((user) => {
					return (
						<Dialog
							open={open && selectedUserId === user.id}
							onOpenChange={setOpen}
							key={user.id}
						>
							<DialogTrigger>
								<Button variant="ghost" onClick={() => setSelectedUserid(user.id)}>
									<div className="mr-4">
										<Image
											src={
												user.avatar ?? `${user.firstName} ${user.lastName}`
											}
											alt={`${user.firstName} ${user.lastName}`}
											width={20}
											height={20}
										/>
									</div>
									<span>
										{user.firstName} {user.lastName}
									</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<Card>
									<CardTitle className="space-y-1.5 p-6">
										Assign <i>{getTitle(props.pub)}</i> to {user.firstName}{" "}
										{user.lastName}?
									</CardTitle>
									<CardContent>
										{user.firstName} {user.lastName} will be notified that they
										have been assigned to this Pub.
									</CardContent>
									<CardFooter className="flex flex-row">
										<Button
											variant="default"
											onClick={(event) => {
												onAssign(
													props.pub.id,
													user.id,
													props.stage.id
												).then(() => setOpen(false));
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
	);
}
