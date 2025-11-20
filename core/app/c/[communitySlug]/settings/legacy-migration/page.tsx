import type { PubFieldsId, PubsId, PubTypesId } from "db/public"
import type { Metadata } from "next"

import { notFound, redirect } from "next/navigation"

import { getPageLoginData } from "~/lib/authentication/loginData"
import { findCommunityBySlug } from "~/lib/server/community"
import { getToBeDeletedStructure } from "~/lib/server/legacy-migration/legacy-cleanup"
import { MigrationForm, UndoMigrationForm } from "./MigrationForm"

export const metadata: Metadata = {
	title: "Import Legacy Community",
}

export default async function Page(props: {
	searchParams: Promise<{
		undo?: string
		pubTypeIds?: PubTypesId[]
		pubFieldIds?: PubFieldsId[]
		pubIds?: PubsId[]
	}>
}) {
	const { undo, pubTypeIds, pubFieldIds, pubIds } = await props.searchParams

	const { user } = await getPageLoginData()
	const community = await findCommunityBySlug()

	if (!community) {
		notFound()
	}

	if (!user.isSuperAdmin) {
		redirect(`/c/${community.slug}/unauthorized`)
	}

	let tobeDeletedStructure: Awaited<ReturnType<typeof getToBeDeletedStructure>> | undefined
	if (undo) {
		tobeDeletedStructure = await getToBeDeletedStructure(community, {
			pubTypes: pubTypeIds,
			pubFields: pubFieldIds,
			pubs: pubIds,
		})
	}

	return (
		<div>
			<h1 className="mb-12 text-2xl font-bold">Legacy Migration</h1>

			<MigrationForm />

			<div className="mt-4" />
			<UndoMigrationForm community={community} toBeDeletedStructure={tobeDeletedStructure} />
		</div>
	)
}
