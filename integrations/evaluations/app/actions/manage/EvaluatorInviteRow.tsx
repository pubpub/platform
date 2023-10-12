"use client";

import { SuggestedMembersQuery } from "@pubpub/sdk";
import { Control, useWatch } from "react-hook-form";
import {
	Badge,
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
} from "ui";
import * as z from "zod";
import { EvaluatorSuggestButton } from "./EvaluatorSuggestButton";
import { EmailFormSchema } from "./types";
import { memo, useState } from "react";

const pad = (n: number) => (n < 10 ? "0" + n : n);
const daysHoursMinutes = (ms: number) => {
	const cd = 24 * 60 * 60 * 1000;
	const ch = 60 * 60 * 1000;
	let d = Math.floor(ms / cd);
	let h = Math.floor((ms - d * cd) / ch);
	let m = Math.round((ms - d * cd - h * ch) / 60000);
	if (m === 60) {
		h++;
		m = 0;
	}
	if (h === 24) {
		d++;
		h = 0;
	}
	return [d, pad(h), pad(m)].join(":");
};

export type EvaluatorInviteRowProps = {
	control: Control<any>;
	time: string | undefined;
	index: number;
	onRemove: (index: number) => void;
	onSuggest: (index: number, query: SuggestedMembersQuery) => void;
};

export const EvaluatorInviteRow = memo((props: EvaluatorInviteRowProps) => {
	const [timeRemaining] = useState(() =>
		props.time ? new Date(props.time).getTime() - Date.now() : Infinity
	);
	const invite = useWatch<z.infer<typeof EmailFormSchema>>({
		control: props.control,
		name: `invites.${props.index}`,
	});
	const invitingExistingUser = typeof invite === "object" && "userId" in invite;
	const inviteSent = timeRemaining <= 0;

	return (
		<div className="flex flex-row gap-4 mb-4">
			<FormField
				name={`invites.${props.index}.email`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={
									invitingExistingUser
										? "(email hidden)"
										: props.index === 0
										? "e.g. stevie@example.org"
										: ""
								}
								{...field}
								disabled={invitingExistingUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				name={`invites.${props.index}.firstName`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={props.index === 0 ? "Stevie" : ""}
								{...field}
								disabled={invitingExistingUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				name={`invites.${props.index}.lastName`}
				render={({ field }) => (
					<FormItem className="flex-1 self-start">
						<FormControl>
							<Input
								placeholder={props.index === 0 ? "Admin" : ""}
								{...field}
								disabled={invitingExistingUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="shrink-0 basis-36">
				<EvaluatorSuggestButton
					index={props.index}
					disabled={invitingExistingUser}
					query={invite as SuggestedMembersQuery}
					onClick={() => props.onSuggest(props.index, invite as SuggestedMembersQuery)}
				/>
				<Dialog>
					<DialogTrigger asChild>
						<Button className="relative" variant="ghost">
							<Icon.Mail className="h-4 w-4" />
							{timeRemaining < Infinity && !inviteSent && (
								<span className="absolute top-[100%] left-[50%] translate-x-[-50%] translate-y-[-20%] text-[10px] px-1 py-0">
									{daysHoursMinutes(timeRemaining)}
								</span>
							)}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Template</DialogTitle>
							{props.time &&
								(inviteSent ? (
									<DialogDescription>
										This email was sent at{" "}
										<strong className="font-medium">
											{new Date(props.time).toLocaleString()}
										</strong>
										, and can no longer be edited.
									</DialogDescription>
								) : (
									<DialogDescription>
										This email is scheduled to be sent at{" "}
										<strong className="font-medium">
											{new Date(props.time).toLocaleString()}
										</strong>
										.
									</DialogDescription>
								))}
						</DialogHeader>
						<div className="flex flex-col justify-between align-baseline gap-4">
							<FormField
								name={`invites.${props.index}.template.subject`}
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
								name={`invites.${props.index}.template.message`}
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
});
