"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { Skeleton } from "ui/skeleton";

import type { GetPubsResult, GetPubTypesResult } from "~/lib/server";

const ContextEditor = dynamic(() => import("context-editor").then((mod) => mod.ContextEditor), {
	ssr: false,
	loading: () => <Skeleton className="h-9 w-full" />,
});

export const ContextEditorClient = ({
	pubs,
	pubTypes,
}: {
	pubs: GetPubsResult;
	pubTypes: GetPubTypesResult;
}) => {
	// TODO: should probably be of type EditorState from prosemirror-state
	const [editorState, setEditorState] = useState<any>(null);
	const getPubs = useCallback(
		(filter: string) => {
			return new Promise<any[]>((resolve, reject) => {
				resolve(pubs);
			});
		},
		[pubs]
	);

	const memoEditor = useMemo(() => {
		return (
			<ContextEditor
				pubId={pubs[0].id}
				pubTypeId={pubTypes[0].id}
				pubTypes={pubTypes}
				getPubs={getPubs}
				getPubById={() => {}}
				atomRenderingComponent={() => {}}
				onChange={(state) => {
					setEditorState(state);
				}}
			/>
		);
	}, [pubs, pubTypes]);

	return (
		<div className="grid grid-cols-2">
			<div>{memoEditor}</div>
			<div className="overflow-auto text-xs">
				<pre>{JSON.stringify(editorState?.doc.toJSON(), null, 2)}</pre>
			</div>
		</div>
	);
};
