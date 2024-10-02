import React, { Suspense } from "react";

import type { PubsId, StagesId } from "db/public";
import { DialogContent, DialogTitle } from "ui/dialog";
import { Skeleton } from "ui/skeleton";

import type { PubEditorMethod } from "./types";
import { SearchParamModal } from "~/lib/client/SearchParamModal";
import { PathAwareDialog } from "../../PathAwareDialog";
import { SkeletonCard } from "../../skeletons/SkeletonCard";
import { PubRemove } from "../RemovePubForm";
import { PubEditor } from "./PubEditor";
import { createPubEditorSearchParamId, parsePubEditorSearchParam } from "./pubEditorSearchParam";

const PubEdit = ({
	method,
	identifyingString,
	parentId,
}: {
	method: PubEditorMethod;
	identifyingString: string;
	parentId?: PubsId;
}) => {
	if (method === "create") {
		// return <PubCreate stageId={identifyingString as StagesId} parentId={parentId} />;
		return <PubEditor pubId={identifyingString} parentId={parentId} />;
	}

	if (method === "update") {
		return <PubEditor pubId={identifyingString} />;
	}

	if (method === "remove") {
		return <PubRemove pubId={identifyingString as PubsId} />;
	}

	return null;
};

export const PubEditorModal = ({ parentId }: { parentId?: PubsId }) => {
	const params = parsePubEditorSearchParam();

	const searchParam = params ? createPubEditorSearchParamId(params) : null;

	return (
		<PathAwareDialog id={searchParam}>
			<DialogContent className="max-h-full min-w-[32rem] max-w-fit overflow-auto">
				{params?.method ? (
					<>
						<DialogTitle>{params.method}</DialogTitle>
						<Suspense fallback={<SkeletonCard />}>
							<PubEdit
								method={params.method}
								identifyingString={params.identifyingString}
								parentId={parentId}
							/>
						</Suspense>
					</>
				) : (
					<Skeleton className="h-4 w-52" />
				)}

				{/* {children} */}
			</DialogContent>
		</PathAwareDialog>
	);
};
