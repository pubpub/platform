"use client";

import { SuggestedMembersQuery } from "@pubpub/sdk";
import { Control, useWatch } from "react-hook-form";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { FormControl, FormField, FormItem, FormMessage } from "ui/form";
import { X } from "ui/icon";
import { cn } from "utils";
import { hasUser } from "~/lib/types";
import { EvaluatorInviteRowEmailDialog } from "./EvaluatorInviteRowEmailDialog";
import { EvaluatorSuggestButton } from "./EvaluatorSuggestButton";
import { EvaluatorInviteRowStatus } from "./EvalutorInviteRowStatus";
import { InviteFormEvaluator, InviteFormSchema } from "./types";

type Props = {
	control: Control<any>;
	invitedAt: string | undefined;
	index: number;
	readOnly?: boolean;
	onRemove: (index: number) => void;
	onSuggest: (index: number, query: SuggestedMembersQuery) => void;
};

export const EvaluatorInviteRow = (props: Props) => {
	const evaluator = useWatch<InviteFormSchema>({
		control: props.control,
		name: `evaluators.${props.index}`,
	}) as InviteFormEvaluator;
	const evaluatorHasUser = hasUser(evaluator);

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
									evaluatorHasUser
										? "(email hidden)"
										: props.index === 0
										? "e.g. stevie@example.org"
										: ""
								}
								{...field}
								disabled={evaluatorHasUser}
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
								disabled={evaluatorHasUser}
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
								disabled={evaluatorHasUser}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div
				className={cn(
					"shrink-0",
					"basis-48",
					"flex",
					"items-center",
					!evaluatorHasUser ? "justify-end" : "justify-between"
				)}
			>
				{evaluatorHasUser && <EvaluatorInviteRowStatus status={evaluator.status} />}
				<div>
					{!evaluatorHasUser && (
						<EvaluatorSuggestButton
							onClick={() => props.onSuggest(props.index, evaluator)}
						/>
					)}
					<EvaluatorInviteRowEmailDialog evaluator={evaluator} index={props.index} />
					<Button variant="ghost" onClick={() => props.onRemove(props.index)}>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
};
