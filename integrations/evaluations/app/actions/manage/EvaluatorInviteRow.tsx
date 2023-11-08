"use client";

import { SuggestedMembersQuery } from "@pubpub/sdk";
import { memo, useEffect, useState } from "react";
import { Control, useWatch } from "react-hook-form";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Icon,
	Input,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "ui";
import { EvaluatorSuggestButton } from "./EvaluatorSuggestButton";
import { InviteFormEvaluator, InviteFormSchema } from "./types";

const pad = (n: number) => (n < 10 ? "0" + n : n);
const daysHoursMinutes = (ms: number) => {
	const msInHour = 60 * 60 * 1000;
	const msInDay = 24 * msInHour;
	let days = Math.floor(ms / msInDay);
	let hours = Math.floor((ms - days * msInDay) / msInHour);
	let minutes = Math.round((ms - days * msInDay - hours * msInHour) / 60000);
	if (minutes === 60) {
		hours++;
		minutes = 0;
	}
	if (hours === 24) {
		days++;
		hours = 0;
	}
	return [days, pad(hours), pad(minutes)].join(":");
};

const getEvaluatorStatusText = (status: InviteFormEvaluator["status"]) => {
	switch (status) {
		case "listed":
			return "Evaluator not invited";
		case "associated":
			return "Evaluator has PubPub account";
		case "invited":
			return "Invite sent";
		case "accepted":
			return "Invite accepted";
		case "declined":
			return "Invite declined";
		case "submitted":
			return "Evalution submitted";
	}
};

const EvaluatorStatusIcon = memo(({ status }: { status: InviteFormEvaluator["status"] }) => {
	let icon: React.ReactNode;
	switch (status) {
		case "listed":
			icon = <Icon.CircleDashed className="h-4 w-4" />;
			break;
		case "associated":
			icon = <Icon.UserCircle2 className="h-4 w-4" />;
			break;
		case "invited":
			icon = <Icon.CircleEllipsis className="h-4 w-4" />;
			break;
		case "accepted":
			icon = <Icon.CheckCircle className="h-4 w-4" />;
			break;
		case "declined":
			icon = <Icon.XCircle className="h-4 w-4" />;
			break;
		case "submitted":
			icon = <Icon.CircleDollarSign className="h-4 w-4" />;
			break;
	}
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>{icon}</TooltipTrigger>
				<TooltipContent>
					<p>{getEvaluatorStatusText(status)}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
});

type Props = {
	control: Control<any>;
	invitedAt: string | undefined;
	index: number;
	readOnly?: boolean;
	onRemove: (index: number) => void;
	onSuggest: (index: number, query: SuggestedMembersQuery) => void;
};

export const EvaluatorInviteRow = (props: Props) => {
	const getTimeBeforeInviteSent = () =>
		props.invitedAt ? new Date(props.invitedAt).getTime() - Date.now() : Infinity;
	const [timeBeforeInviteSent, setTimeBeforeInviteSent] = useState(getTimeBeforeInviteSent);
	const evaluator = useWatch<InviteFormSchema>({
		control: props.control,
		name: `evaluators.${props.index}`,
	}) as InviteFormEvaluator;
	const inviteSent = timeBeforeInviteSent <= 0;
	const inviteHasUser = typeof evaluator === "object" && "userId" in evaluator;

	// Update the timer every second.
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (timeBeforeInviteSent > 0) {
			interval = setInterval(() => {
				const timeBeforeInviteSent = getTimeBeforeInviteSent();
				setTimeBeforeInviteSent(timeBeforeInviteSent);
				// Clear the timer when the invite would be sent.
				if (timeBeforeInviteSent <= 0) clearInterval(interval);
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [props.invitedAt]);

	return (
		<div className="flex flex-row gap-4 mb-4">
			<FormField
				name={`evaluators.${props.index}.selected`}
				render={({ field }) => {
					return (
						<FormItem className="flex w-4 items-center">
							<FormControl>
								<input
									type="checkbox"
									{...field}
									disabled={props.readOnly}
									className="disabled:opacity-50"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					);
				}}
			/>
			<FormField
				name={`evaluators.${props.index}.email`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={
									inviteHasUser
										? "(email hidden)"
										: props.index === 0
										? "e.g. stevie@example.org"
										: ""
								}
								{...field}
								disabled={inviteHasUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				name={`evaluators.${props.index}.firstName`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={props.index === 0 ? "Stevie" : ""}
								{...field}
								disabled={inviteHasUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				name={`evaluators.${props.index}.lastName`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={props.index === 0 ? "Admin" : ""}
								{...field}
								disabled={inviteHasUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="shrink-0 basis-36">
				<EvaluatorSuggestButton
					index={props.index}
					icon={<EvaluatorStatusIcon status={evaluator.status} />}
					disabled={inviteHasUser}
					query={evaluator}
					onClick={() => props.onSuggest(props.index, evaluator)}
				/>
				<Dialog>
					<DialogTrigger asChild>
						<Button className="relative" variant="ghost">
							<Icon.Mail className="h-4 w-4" />
							{timeBeforeInviteSent < Infinity && !inviteSent && (
								<span className="absolute top-[100%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-[10px] px-1 py-0">
									{daysHoursMinutes(timeBeforeInviteSent)}
								</span>
							)}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Template</DialogTitle>
							{props.invitedAt &&
								(inviteSent ? (
									<DialogDescription>
										This email was sent at{" "}
										<strong className="font-medium">
											{new Date(props.invitedAt).toLocaleString()}
										</strong>
										, and can no longer be edited.
									</DialogDescription>
								) : (
									<DialogDescription>
										This email is scheduled to be sent at{" "}
										<strong className="font-medium">
											{new Date(props.invitedAt).toLocaleString()}
										</strong>
										.
									</DialogDescription>
								))}
						</DialogHeader>
						<div className="flex flex-col justify-between align-baseline gap-4">
							<FormField
								name={`evaluators.${props.index}.emailTemplate.subject`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Subject</FormLabel>
										<FormControl>
											<Input {...field} disabled={inviteSent} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name={`evaluators.${props.index}.emailTemplate.message`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email Message</FormLabel>
										<FormControl className="mt-[8px]">
											<Textarea
												{...field}
												required
												disabled={inviteSent}
												rows={8}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</DialogContent>
				</Dialog>
				<Button variant="ghost" onClick={() => props.onRemove(props.index)}>
					<Icon.X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};
