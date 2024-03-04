"use client";

import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Mail } from "ui/icon";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { isInvited } from "~/lib/types";
import { InviteFormEvaluator } from "./types";

export type EvaluatorInviteRowEmailDialogProps = {
	index: number;
	evaluator: InviteFormEvaluator;
};

export const EvaluatorInviteRowEmailDialog = (props: EvaluatorInviteRowEmailDialogProps) => {
	const evaluatorHasInvite = isInvited(props.evaluator);
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className="relative" variant="ghost">
					<Mail className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Template</DialogTitle>
					{isInvited(props.evaluator) && (
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
