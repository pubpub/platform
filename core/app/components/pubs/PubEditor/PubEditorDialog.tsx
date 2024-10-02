import React, { Suspense } from "react";

import { DialogContent, DialogTitle } from "ui/dialog";
import { Skeleton } from "ui/skeleton";

import type { ParsedPubEditorSearchParam } from "./pubEditorSearchParam";
import { PathAwareDialog } from "../../PathAwareDialog";
import { SkeletonCard } from "../../skeletons/SkeletonCard";
import { PubRemove } from "../RemovePubForm";
import { PubEditor } from "./PubEditor";
import { createPubEditorSearchParamId, parsePubEditorSearchParam } from "./pubEditorSearchParam";

function PubEdit({
	searchParams,
	...props
}: ParsedPubEditorSearchParam & {
	searchParams: Record<string, string | string[] | undefined>;
}) {
	if (props.method === "create") {
		// return <PubCreate stageId={identifyingString as StagesId} parentId={parentId} />;
		return (
			<PubEditor
				method="create"
				stageId={props.stageId}
				parentId={props.parentId}
				searchParams={searchParams}
			/>
		);
	}

	if (props.method === "update") {
		return <PubEditor pubId={props.pubId} method="update" searchParams={searchParams} />;
	}

	if (props.method === "remove") {
		return <PubRemove pubId={props.pubId} />;
	}

	return null;
}

export const PubEditorDialog = ({
	searchParams,
}: {
	searchParams: Record<string, string | string[] | undefined>;
}) => {
	const params = parsePubEditorSearchParam(searchParams);

	const id = params ? createPubEditorSearchParamId(params) : null;

	return (
		<PathAwareDialog id={id}>
			<DialogContent className="max-h-full min-w-[32rem] max-w-fit overflow-auto">
				{params?.method ? (
					<>
						<DialogTitle>{params.method}</DialogTitle>
						<Suspense fallback={<SkeletonCard />}>
							<PubEdit searchParams={searchParams} {...params} />
						</Suspense>
					</>
				) : (
					<Skeleton className="h-4 w-52" />
				)}
			</DialogContent>
		</PathAwareDialog>
	);
};
