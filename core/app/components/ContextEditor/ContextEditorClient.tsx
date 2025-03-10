import type { ContextEditorProps } from "context-editor";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

import type { PubsId, PubTypesId } from "db/public";
import { Skeleton } from "ui/skeleton";

import type { GetPubsResult, GetPubTypesResult } from "~/lib/server";
import { upload } from "../forms/actions";
import { ContextAtom } from "./AtomRenderer";

import "context-editor/style.css";

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
	disabled,
	hideMenu,
}: {
	pubs: GetPubsResult;
	pubTypes: GetPubTypesResult;
	pubId: PubsId;
	pubTypeId: PubTypesId;
	// Might be able to use more of this type in the future—for now, this component is a lil more stricty typed than context-editor
} & Pick<
	ContextEditorProps,
	"onChange" | "initialDoc" | "className" | "disabled" | "hideMenu"
>) => {
	const getPubs = useCallback(
		(filter: string) => {
			return new Promise<any[]>((resolve, reject) => {
				resolve(pubs);
			});
		},
		[pubs]
	);
	const signedUploadUrl = (fileName: string) => {
		return upload(pubId, fileName);
	};

	const memoEditor = useMemo(() => {
		return (
			<ContextEditor
				pubId={pubId}
				pubTypeId={pubTypeId}
				pubTypes={pubTypes}
				getPubs={getPubs}
				getPubById={() => {
					return {};
				}}
				atomRenderingComponent={ContextAtom}
				onChange={onChange}
				initialDoc={initialDoc}
				disabled={disabled}
				className={className}
				hideMenu={hideMenu}
				upload={signedUploadUrl}
			/>
		);
	}, [pubs, pubTypes, disabled]);

	return memoEditor;
};
