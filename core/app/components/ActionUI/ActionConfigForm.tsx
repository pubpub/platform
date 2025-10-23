"use client";

import type { z } from "zod";

import { startTransition, Suspense, useCallback, useMemo } from "react";

import type { ActionInstances, ActionInstancesId, StagesId } from "db/public";
import { TokenProvider } from "ui/tokens";
import { toast } from "ui/use-toast";

import { ActionForm } from "~/actions/_lib/ActionForm";
import { ActionFormProvider } from "~/actions/_lib/ActionFormProvider";
import { getActionByName } from "~/actions/api";
import { getActionFormComponent } from "~/actions/forms";
import { deleteAction, updateAction } from "~/app/c/[communitySlug]/stages/manage/actions";
import { useServerAction } from "~/lib/serverActions";
import { useCommunity } from "../providers/CommunityProvider";
import { SkeletonCard } from "../skeletons/SkeletonCard";

export type Props = {
	actionInstance: ActionInstances;
	stageId: StagesId;
	defaultFields: string[];
};

export const ActionConfigForm = (props: Props) => {
	const community = useCommunity();
	const action = getActionByName(props.actionInstance.action);

	const runDeleteAction = useServerAction(deleteAction);
	const onDelete = useCallback(async () => {
		await runDeleteAction(props.actionInstance.id as ActionInstancesId, props.stageId);
	}, [runDeleteAction, props.actionInstance.id, props.stageId]);

	const schema = useMemo(() => {
		const schemaWithPartialDefaults = (action.config.schema as z.ZodObject<any>).partial(
			props.defaultFields.reduce(
				(acc, key) => {
					acc[key] = true;
					return acc;
				},
				{} as Record<string, true>
			)
		);
		return schemaWithPartialDefaults;
	}, [action.config.schema, props.defaultFields]);

	const runUpdateAction = useServerAction(updateAction);

	const onSubmit = useCallback(
		async (values: z.infer<typeof schema>) => {
			startTransition(async () => {
				const result = await runUpdateAction(
					props.actionInstance.id as ActionInstancesId,
					props.stageId,
					{
						config: values,
					}
				);

				if (result && "success" in result) {
					toast({
						title: "Action updated successfully!",
						variant: "default",
						// TODO: SHOULD ABSOLUTELY BE SANITIZED
						description: (
							<div dangerouslySetInnerHTML={{ __html: result.report ?? "" }} />
						),
					});
				}
			});
		},
		[runUpdateAction, props.actionInstance.id, community.id]
	);

	const ActionFormComponent = getActionFormComponent(action.name);

	return (
		<TokenProvider tokens={action.tokens ?? {}}>
			<ActionFormProvider
				action={action}
				values={props.actionInstance.config ?? {}}
				defaultFields={props.defaultFields}
			>
				<ActionForm
					onSubmit={onSubmit}
					submitButton={{
						text: "Update Action",
						pendingText: "Updating Action...",
						successText: "Action Updated",
						errorText: "Failed to update action",
					}}
					secondaryButton={{
						text: "Remove Action",
						onClick: onDelete,
					}}
				>
					<Suspense fallback={<SkeletonCard />}>
						<ActionFormComponent />
					</Suspense>
				</ActionForm>
			</ActionFormProvider>
		</TokenProvider>
	);
};
