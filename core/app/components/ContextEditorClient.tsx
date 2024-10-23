"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { Skeleton } from "ui/skeleton";
import { cn } from "utils";

import type { GetPubsResult, GetPubTypesResult } from "~/lib/server";

const ContextEditor = dynamic(() => import("context-editor").then((mod) => mod.ContextEditor), {
	ssr: false,
	loading: () => <Skeleton className="h-16 w-full" />,
});

export const ContextEditorClient = ({
	pubs,
	pubTypes,
	className,
}: {
	pubs: GetPubsResult;
	pubTypes: GetPubTypesResult;
	className?: string;
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
		const pubId = pubs[0]?.id ?? "";
		const pubTypeId = pubTypes[0]?.id ?? ";";
		return (
			<ContextEditor
				pubId={pubId}
				pubTypeId={pubTypeId}
				pubTypes={pubTypes}
				getPubs={getPubs}
				getPubById={() => {
					return {};
				}}
				atomRenderingComponent={() => {}}
				onChange={(state) => {
					setEditorState(state);
				}}
			/>
		);
	}, [pubs, pubTypes]);

	return <div className={cn(className)}>{memoEditor}</div>;
};
