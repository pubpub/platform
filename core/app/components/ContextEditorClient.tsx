"use client";

import { useCallback } from "react";
import { ContextEditor } from "context-editor";

import type { GetPubsResult, GetPubTypesResult } from "~/lib/server";

export const ContextEditorClient = ({
	pubs,
	pubTypes,
}: {
	pubs: GetPubsResult;
	pubTypes: GetPubTypesResult;
}) => {
	const getPubs = useCallback(
		(filter: string) => {
			return new Promise<any[]>((resolve, reject) => {
				resolve(pubs);
			});
		},
		[pubs]
	);

	return (
		<div className="border">
			<ContextEditor
				pubId={pubs[0].id}
				pubTypeId={pubTypes[0].id}
				pubTypes={pubTypes}
				getPubs={getPubs}
				getPubById={() => {}}
				atomRenderingComponent={() => {}}
				onChange={(state) => {
					console.log({ state });
				}}
			/>
		</div>
	);
};
