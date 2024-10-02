import "server-only";

import { Suspense } from "react";

import type { ActionInstancesId, PubsId } from "db/public";
import { DialogContent, DialogHeader, DialogTitle } from "ui/dialog";

import { getActionInstance } from "~/lib/server/actions";
import { findCommunityBySlug } from "~/lib/server/community";
import { getPathAwareDialogSearchParam } from "~/lib/server/pathAwareDialogParams";
import type { PageContext } from "~/lib/types";
import { PathAwareDialog } from "../PathAwareDialog";
import { SkeletonCard } from "../skeletons/SkeletonCard";
import {
	createActionRunFormQueryParam,
	parseActionRunFormQueryParam,
} from "./actionRunFormSearchParam";
import { ActionRunFormWrapper } from "./ActionRunFormWrapper";

export const ActionRunDialog = ({ pageContext }: { pageContext: PageContext }) => {
	const id = getPathAwareDialogSearchParam() || "";

	const props = parseActionRunFormQueryParam(pageContext.searchParams);

	return (
		<PathAwareDialog id={id}>
			<DialogContent className="max-h-full overflow-y-auto">
				<Suspense fallback={<SkeletonCard />}>
					{props !== null && (
						<ActionRunDialogInner
							pubId={props.pubId}
							actionInstanceId={props.actionInstanceId}
							pageContext={pageContext}
						/>
					)}
				</Suspense>
			</DialogContent>
		</PathAwareDialog>
	);
};

const ActionRunDialogInner = async ({
	actionInstanceId,
	pubId,
	pageContext,
}: {
	actionInstanceId: ActionInstancesId;
	pubId: PubsId;
	pageContext: PageContext;
}) => {
	const [actionInstance, community] = await Promise.all([
		getActionInstance(actionInstanceId).executeTakeFirst(),
		findCommunityBySlug(),
	]);

	if (!actionInstance || !community) {
		// TODO: Show error state
		return null;
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>{actionInstance.name || actionInstance.action}</DialogTitle>
			</DialogHeader>
			<ActionRunFormWrapper
				actionInstance={actionInstance}
				pubId={pubId}
				communityId={community.id}
				pageContext={pageContext}
			/>
		</>
	);
};
