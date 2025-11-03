"use client";

import type { UseFormReturn } from "react-hook-form";

import { Suspense, useCallback, useState } from "react";

import type { ActionInstances, CommunitiesId, PubsId } from "db/public";
import { logger } from "logger";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import { ActionForm } from "~/actions/_lib/ActionForm";
import { getActionByName } from "~/actions/api";
import { runActionInstance } from "~/actions/api/serverAction";
import { getActionFormComponent } from "~/actions/forms";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { useServerAction } from "~/lib/serverActions";
import { useCommunity } from "../providers/CommunityProvider";

type Props = {
	actionInstance: ActionInstances;
	pubId: PubsId;
	defaultFields: string[];
};

export const ActionRunForm = (props: Props) => {
	const action = getActionByName(props.actionInstance.action);
	const ActionFormComponent = getActionFormComponent(action.name);
	const community = useCommunity();
	const runAction = useServerAction(runActionInstance);

	const onSubmit = useCallback(
		async (values: Record<string, unknown>, form: UseFormReturn<any>) => {
			const result = await runAction({
				actionInstanceId: props.actionInstance.id,
				pubId: props.pubId,
				actionInstanceArgs: values,
				communityId: community.id as CommunitiesId,
				stack: [],
			});

			if ("success" in result) {
				toast({
					title:
						"title" in result && typeof result.title === "string"
							? result.title
							: `Successfully ran ${props.actionInstance.name || action.name}`,
					variant: "default",
					description: (
						<div className="max-h-40 max-w-sm overflow-auto">{result.report}</div>
					),
				});
				return;
			}
			if ("issues" in result && result.issues) {
				const issues = result.issues;
				for (const issue of issues) {
					form.setError(issue.path.join("."), {
						message: issue.message,
					});
				}
			}

			form.setError("root.serverError", {
				message: result.error,
			});
		},
		[runAction, props.actionInstance.id, props.pubId]
	);

	const [open, setOpen] = useState(false);

	const onClose = useCallback(() => {
		setOpen(false);
	}, []);

	if (!action) {
		logger.info(`Invalid action name ${props.actionInstance.action}`);
		return null;
	}

	return (
		<TokenProvider tokens={action.tokens ?? {}}>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						variant="ghost"
						className="flex w-full items-center justify-start gap-x-4 px-4 py-2"
					>
						<action.icon size="14" className="flex-shrink-0" />
						<span className="overflow-auto text-ellipsis">
							{props.actionInstance.name || action.name}
						</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="top-20 max-h-[85vh] translate-y-0 overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{props.actionInstance.name || action.name}</DialogTitle>
					</DialogHeader>
					<ActionForm
						action={action}
						values={props.actionInstance.config ?? {}}
						defaultFields={props.defaultFields}
						onSubmit={onSubmit}
						submitButton={{
							text: "Run Action",
							pendingText: "Running Action...",
							successText: "Action Ran",
							errorText: "Failed to run action",
						}}
						secondaryButton={{
							text: "Cancel",
							onClick: onClose,
						}}
						context={{ type: "run", pubId: props.pubId }}
					>
						<Suspense fallback={<SkeletonCard />}>
							<ActionFormComponent />
						</Suspense>
					</ActionForm>
				</DialogContent>
			</Dialog>
		</TokenProvider>
	);
};
