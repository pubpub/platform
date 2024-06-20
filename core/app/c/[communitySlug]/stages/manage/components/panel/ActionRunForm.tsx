"use client";

import { Suspense, useCallback, useTransition } from "react";

import type { FieldConfig } from "ui/auto-form";
import { logger } from "logger";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Loader2, Play } from "ui/icon";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import type { StagePub } from "./queries";
import type { ActionInstances, ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { getActionByName } from "~/actions/api";
import { runActionInstance } from "~/actions/api/serverAction";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { useServerAction } from "~/lib/serverActions";

export const ActionRunForm = ({
	actionInstance,
	pub,
	fieldConfig,
}: {
	actionInstance: ActionInstances;
	pub: StagePub;
	fieldConfig: FieldConfig<any>;
}) => {
	const runAction = useServerAction(runActionInstance);

	const [isPending, startTransition] = useTransition();

	const action = getActionByName(actionInstance.action);

	if (!action) {
		logger.info(`Invalid action name ${actionInstance.action}`);
		return null;
	}

	const onSubmit = useCallback(
		async (values) => {
			startTransition(async () => {
				const result = await runAction({
					actionInstanceId: actionInstance.id as ActionInstancesId,
					pubId: pub.id as PubsId,
					actionInstanceArgs: values,
				});

				if ("success" in result) {
					toast({
						title: "Action ran successfully!",
						variant: "default",
						// TODO: SHOULD ABSOLUTELY BE SANITIZED
						description: (
							<div
								className="max-h-40 max-w-sm overflow-auto"
								dangerouslySetInnerHTML={{ __html: result.report ?? "" }}
							/>
						),
					});
				}
			});
		},
		[runAction, actionInstance.id, pub.id]
	);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					className="flex w-full items-center justify-start gap-x-4 px-4 py-2"
				>
					<action.icon size="14" className="flex-shrink-0" />
					<span className="overflow-auto text-ellipsis">
						{actionInstance.name || action.name}
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{actionInstance.name || action.name}</DialogTitle>
				</DialogHeader>
				<Suspense fallback={<SkeletonCard />}>
					<TokenProvider tokens={action.tokens ?? {}}>
						<AutoForm
							values={actionInstance.config ?? {}}
							fieldConfig={fieldConfig}
							formSchema={action.params.schema}
							dependencies={action.params.dependencies}
							onSubmit={onSubmit}
						>
							<AutoFormSubmit
								disabled={isPending}
								className="flex items-center gap-x-2"
							>
								{isPending ? (
									<Loader2 size="14" className="animate-spin" />
								) : (
									<>
										<Play size="14" /> Run
									</>
								)}
							</AutoFormSubmit>
						</AutoForm>
					</TokenProvider>
				</Suspense>
			</DialogContent>
		</Dialog>
	);
};
