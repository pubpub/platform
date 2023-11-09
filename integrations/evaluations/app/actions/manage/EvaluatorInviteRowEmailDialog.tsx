"use client";

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
} from "ui";
import { hasInvite } from "~/lib/types";
import { InviteFormEvaluator } from "./types";

export type EvaluatorInviteRowEmailDialogProps = {
	index: number;
	evaluator: InviteFormEvaluator;
};

export const EvaluatorInviteRowEmailDialog = (props: EvaluatorInviteRowEmailDialogProps) => {
	const evaluatorHasInvite = hasInvite(props.evaluator);
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="relative" variant="ghost">
					<Icon.Mail className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Template</DialogTitle>
					{hasInvite(props.evaluator) && (
						<DialogDescription>
							This email was sent at{" "}
							<strong className="font-medium">
								{new Date(props.evaluator.invitedAt).toLocaleString()}
							</strong>
							, and can no longer be edited.
						</DialogDescription>
					)}
				</DialogHeader>
				<div className="flex flex-col justify-between align-baseline gap-4">
					<FormField
						name={`evaluators.${props.index}.emailTemplate.subject`}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Subject</FormLabel>
								<FormControl>
									<Input {...field} disabled={evaluatorHasInvite} />
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
										disabled={evaluatorHasInvite}
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
	);
};
