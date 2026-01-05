import type { ContextEditorProps } from "context-editor"
import type { PubsId, PubTypes, PubTypesId } from "db/public"

import { useCallback, useMemo } from "react"
import dynamic from "next/dynamic"

import { Skeleton } from "ui/skeleton"

import { upload } from "../forms/actions"
import { ContextAtom } from "./AtomRenderer"

import "context-editor/style.css"

import { useDebouncedCallback } from "use-debounce"

import { client } from "~/lib/api"
import { useServerAction } from "~/lib/serverActions"
import { useCommunity } from "../providers/CommunityProvider"

const ContextEditor = dynamic(() => import("context-editor").then((mod) => mod.ContextEditor), {
	ssr: false,
	// make sure this is the same height as the context editor, otherwise looks ugly
	loading: () => (
		<Skeleton className="h-[440px] w-full">
			<Skeleton className="h-14 w-full rounded-b-none" />
		</Skeleton>
	),
})

export const ContextEditorClient = (
	props: {
		pubTypes: Pick<PubTypes, "id" | "name">[]
		pubId: PubsId
		pubTypeId: PubTypesId
		// Might be able to use more of this type in the future—for now, this component is a lil more stricty typed than context-editor
	} & Pick<
		ContextEditorProps,
		"onChange" | "initialDoc" | "className" | "disabled" | "hideMenu" | "getterRef"
	>
) => {
	const runUpload = useServerAction(upload)

	const community = useCommunity()
	const getPubs = useCallback(
		async (filter: string) => {
			const res = await client.pubs.getMany.query({
				query: {
					withValues: true,
					withPubType: true,
					withStage: true,
					limit: 10,
					depth: 2,
					search: filter,
				},
				params: {
					communitySlug: community.slug,
				},
			})

			if (res.status !== 200) {
				return []
			}

			return res.body ?? []
		},
		[community.slug]
	)

	const debouncedGetPubs = useDebouncedCallback(getPubs, 300)

	const signedUploadUrl = (fileName: string) => {
		return runUpload(fileName, "temporary")
	}

	const memoEditor = useMemo(() => {
		return (
			<ContextEditor
				pubId={props.pubId}
				pubTypeId={props.pubTypeId}
				pubTypes={props.pubTypes}
				// @ts-expect-error - its fine, debounce returns `undefined` at the beginning
				getPubs={debouncedGetPubs}
				getPubById={() => {
					return {}
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
		)
	}, [
		props.pubTypes,
		props.disabled,
		getPubs,
		props.className,
		props.getterRef,
		props.hideMenu,
		props.initialDoc,
		props.onChange,
		props.pubId,
		props.pubTypeId,
		signedUploadUrl,
	])

	return memoEditor
}
