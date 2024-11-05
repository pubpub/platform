import type { ContextEditorProps } from "context-editor";

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
	disabled,
}: {
	pubs: GetPubsResult;
	pubTypes: GetPubTypesResult;
	pubId?: PubsId;
	pubTypeId: PubTypesId;
	// Might be able to use more of this type in the future—for now, this component is a lil more stricty typed than context-editor
} & Pick<ContextEditorProps, "onChange" | "initialDoc" | "className" | "disabled">) => {
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
				disabled={disabled}
			/>
		);
	}, [pubs, pubTypes, disabled]);

	return <div className={cn(className)}>{memoEditor}</div>;
};
