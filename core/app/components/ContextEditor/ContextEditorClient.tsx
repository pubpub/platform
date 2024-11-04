import type { Node } from "prosemirror-model";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

import type { PubsId, PubTypesId } from "db/public";
import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

import type { GetPubsResult, GetPubTypesResult } from "~/lib/server";
import { ContextAtom } from "./AtomRenderer";

const ContextEditor = dynamic(() => import("context-editor").then((mod) => mod.ContextEditor), {
	ssr: false,
	loading: () => <Skeleton className="h-16 w-full" />,
});

export const ContextEditorClient = ({
	pubs,
	pubTypes,
	pubId,
	pubTypeId,
	className,
	initialDoc,
	onChange,
}: {
	pubs: GetPubsResult;
	pubTypes: GetPubTypesResult;
	pubId?: PubsId;
	pubTypeId: PubTypesId;
	// TODO: should probably be of type EditorState from prosemirror-state
	onChange: (editorState: any) => void;
	initialDoc?: Node;
	className?: string;
}) => {
	const getPubs = useCallback(
		(filter: string) => {
			return new Promise<any[]>((resolve, reject) => {
				resolve(pubs);
			});
		},
		[pubs]
	);

	const memoEditor = useMemo(() => {
		// const pubId = pubs[0]?.id ?? "";
		// const pubTypeId = pubTypes[0]?.id ?? ";";
		return (
			<ContextEditor
				pubId={pubId ?? ""} // fix?
				pubTypeId={pubTypeId}
				pubTypes={pubTypes}
				getPubs={getPubs}
				getPubById={() => {
					return {};
				}}
				atomRenderingComponent={ContextAtom}
				onChange={onChange}
				initialDoc={initialDoc}
			/>
		);
	}, [pubs, pubTypes]);

	return <div className={cn(className)}>{memoEditor}</div>;
};
