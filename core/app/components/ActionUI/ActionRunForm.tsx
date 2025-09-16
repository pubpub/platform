"use client";

import type { z } from "zod";

import { Suspense, useCallback, useMemo, useTransition } from "react";

import type { ActionInstances, ActionInstancesId, CommunitiesId, PubsId } from "db/public";
import type { FieldConfig } from "ui/auto-form";
import { logger } from "logger";
import AutoForm, { AutoFormSubmit } from "ui/auto-form";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Loader2, Play } from "ui/icon";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import { getActionByName } from "~/actions/api";
import { runActionInstance } from "~/actions/api/serverAction";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { useServerAction } from "~/lib/serverActions";
import { useCommunity } from "../providers/CommunityProvider";
import { createDefaultFieldConfig } from "./defaultFieldConfig";

type Props = {
	actionInstance: ActionInstances;
	pubId: PubsId;
	defaultFields: string[];
};

export const ActionRunForm = (props: Props) => {
	const action = getActionByName(props.actionInstance.action);
	const defaultFieldConfig = createDefaultFieldConfig(
		props.defaultFields,
		action.params.fieldConfig
	);

	const [isPending, startTransition] = useTransition();
	const schema = useMemo(() => {
		const schemaWithPartialDefaults = (action.params.schema as z.ZodObject<any>)
			.partial(
				props.defaultFields.reduce(
					(acc, key) => {
						acc[key] = true;
						return acc;
					},
					{} as Record<string, true>
				)
			)
			.optional();
		return schemaWithPartialDefaults;
	}, [action.params.schema, props.defaultFields]);
	const community = useCommunity();
	const runAction = useServerAction(runActionInstance);

	if (!action) {
		logger.info(`Invalid action name ${props.actionInstance.action}`);
		return null;
	}

	const onSubmit = useCallback(
		async (values: z.infer<typeof action.params.schema>) => {
			startTransition(async () => {
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
								: "Action ran successfully!",
						variant: "default",
						// TODO: SHOULD ABSOLUTELY BE SANITIZED
						description: (
							<div className="max-h-40 max-w-sm overflow-auto">{result.report} </div>
						),
					});
				}
			});
		},
		[runAction, props.actionInstance.id, props.pubId]
	);

	return (
		<TokenProvider tokens={action.tokens ?? {}}>
			<Dialog>
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
				<DialogContent className="max-h-full overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{props.actionInstance.name || action.name}</DialogTitle>
					</DialogHeader>
					<Suspense fallback={<SkeletonCard />}>
						<AutoForm
							values={props.actionInstance.config ?? {}}
							fieldConfig={defaultFieldConfig}
							formSchema={schema}
							dependencies={action.params.dependencies}
							onSubmit={onSubmit}
						>
							<AutoFormSubmit
								disabled={isPending}
								className="flex items-center gap-x-2"
								data-testid="action-run-button"
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
					</Suspense>
				</DialogContent>
			</Dialog>
		</TokenProvider>
	);
};
