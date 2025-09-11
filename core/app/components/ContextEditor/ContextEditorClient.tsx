import type { ContextEditorProps } from "context-editor";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

import type { PubsId, PubTypes, PubTypesId } from "db/public";
import { Skeleton } from "ui/skeleton";

import { upload } from "../forms/actions";
import { ContextAtom } from "./AtomRenderer";

import "context-editor/style.css";

import type { ContextEditorPub } from "./ContextEditorContext";
import { useServerAction } from "~/lib/serverActions";

const ContextEditor = dynamic(() => import("context-editor").then((mod) => mod.ContextEditor), {
	ssr: false,
	// make sure this is the same height as the context editor, otherwise looks ugly
	loading: () => (
		<Skeleton className="h-[440px] w-full">
			<Skeleton className="h-14 w-full rounded-b-none" />
		</Skeleton>
	),
});

export const ContextEditorClient = (
	props: {
		pubs: ContextEditorPub[];
		pubTypes: Pick<PubTypes, "id" | "name">[];
		pubId: PubsId;
		pubTypeId: PubTypesId;
		// Might be able to use more of this type in the future—for now, this component is a lil more stricty typed than context-editor
	} & Pick<
		ContextEditorProps,
		"onChange" | "initialDoc" | "className" | "disabled" | "hideMenu" | "getterRef"
	>
) => {
	const runUpload = useServerAction(upload);

	const getPubs = useCallback(
		(filter: string) => {
			return new Promise<any[]>((resolve, reject) => {
				resolve(props.pubs);
			});
		},
		[props.pubs]
	);

	const signedUploadUrl = (fileName: string) => {
		return runUpload(fileName, props.pubId);
	};

	const memoEditor = useMemo(() => {
		return (
			<ContextEditor
				pubId={props.pubId}
				pubTypeId={props.pubTypeId}
				pubTypes={props.pubTypes}
				getPubs={getPubs}
				getPubById={() => {
					return {};
				}}
				atomRenderingComponent={ContextAtom}
				onChange={props.onChange}
				initialDoc={props.initialDoc}
				disabled={props.disabled}
				className={props.className}
				hideMenu={props.hideMenu}
				upload={signedUploadUrl}
				getterRef={props.getterRef}
			/>
		);
	}, [props.pubs, props.pubTypes, props.disabled]);

	return memoEditor;
};
