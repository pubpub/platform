"use server"

import type {
	CommunitiesId,
	FormElementsId,
	FormsId,
	NewFormElements,
	NewFormElementToPubType,
	PubsId,
} from "db/public"
import type { QB } from "~/lib/server/cache/types"
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils"
import type { FormBuilderSchema } from "./types"

import { Capabilities, MembershipType, StructuralFormElement } from "db/public"
import { logger } from "logger"

import { db } from "~/kysely/database"
import { isUniqueConstraintError } from "~/kysely/errors"
import { getLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { transformRichTextValuesToProsemirrorServer } from "~/lib/editor/serialize-server"
import { ApiError } from "~/lib/server"
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate"
import { findCommunityBySlug } from "~/lib/server/community"
import { defineServerAction } from "~/lib/server/defineServerAction"
import { getPubsWithRelatedValues } from "~/lib/server/pub"
import {
	renderMarkdownAsHtml,
	renderMarkdownWithPub,
} from "~/lib/server/render/pub/renderMarkdownWithPub"

const upsertRelatedPubTypes = async (
	values: NewFormElementToPubType[],
	deletedRelatedPubTypes: FormElementsId[],
	trx = db
) => {
	const formElementIds = [...values.map((v) => v.A), ...deletedRelatedPubTypes]

	if (formElementIds.length) {
		// Delete old values
		await autoRevalidate(
			trx.deleteFrom("_FormElementToPubType").where("A", "in", formElementIds)
		).execute()
	}

	// Insert new ones
	if (values.length) {
		await autoRevalidate(trx.insertInto("_FormElementToPubType").values(values)).execute()
	}
}

export const saveForm = defineServerAction(async function saveForm(form: {
	formId: FormsId
	upserts: NewFormElements[]
	deletes: FormElementsId[]
	relatedPubTypes: NewFormElementToPubType[]
	deletedRelatedPubTypes: FormElementsId[]
	access?: FormBuilderSchema["access"]
	name?: FormBuilderSchema["name"]
	isDefault?: FormBuilderSchema["isDefault"]
}) {
	const loginData = await getLoginData()

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN
	}

	const community = await findCommunityBySlug()

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND
	}

	const authorized = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	)

	if (!authorized) {
		return ApiError.UNAUTHORIZED
	}

	const {
		formId,
		upserts,
		deletes,
		access,
		name,
		isDefault,
		relatedPubTypes,
		deletedRelatedPubTypes,
	} = form

	logger.info({ msg: "saving form", form, upserts, deletes })
	if (!upserts.length && !deletes.length && !access && !name && !isDefault) {
		return
	}
	try {
		const _result = await db.transaction().execute(async (trx) => {
			let query = trx as unknown

			if (upserts.length) {
				query = (query as typeof trx).with("upserts", (db) =>
					db
						.insertInto("form_elements")
						.values(upserts)
						.onConflict((oc) =>
							oc.column("id").doUpdateSet((eb) => {
								const keys = Object.keys(upserts[0]) as (keyof NewFormElements)[]
								return Object.fromEntries(
									keys.map((key) => [key, eb.ref(`excluded.${key}`)])
								)
							})
						)
				)
			}

			if (deletes.length) {
				query = (query as typeof trx).with("deletes", (db) =>
					db.deleteFrom("form_elements").where("form_elements.id", "in", deletes)
				)
			}
			console.log(form)

			console.log({ access, name, isDefault })
			if (access || name || isDefault) {
				query = (query as typeof trx)
					.updateTable("forms")
					.set({
						...(access && { access }),
						...(name && { name }),
						...(isDefault && { isDefault }),
					})
					.where("forms.id", "=", formId)
			} else {
				query = (query as typeof trx)
					.selectFrom("forms")
					.select("id")
					.where("forms.id", "=", formId)
			}

			const result = await autoRevalidate(query as QB<any>).executeTakeFirstOrThrow()

			await upsertRelatedPubTypes(relatedPubTypes, deletedRelatedPubTypes, trx)

			return result
		})

		return {
			success: true,
		}
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return { error: `An element with this label already exists. Choose a new name` }
		}
		logger.error({ msg: "error saving form", error })
		return { error: "Unable to save form" }
	}
})

export const archiveForm = defineServerAction(async function archiveForm(id: FormsId) {
	const loginData = await getLoginData()

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN
	}

	const community = await findCommunityBySlug()

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND
	}

	const authorized = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	)

	if (!authorized) {
		return ApiError.UNAUTHORIZED
	}

	try {
		await autoRevalidate(
			db.updateTable("forms").set({ isArchived: true }).where("forms.id", "=", id)
		).executeTakeFirstOrThrow()
	} catch (error) {
		return { error: "Unable to archive form", cause: error }
	}
})

export const restoreForm = defineServerAction(async function unarchiveForm(id: FormsId) {
	const loginData = await getLoginData()

	if (!loginData || !loginData.user) {
		return ApiError.NOT_LOGGED_IN
	}

	const community = await findCommunityBySlug()

	if (!community) {
		return ApiError.COMMUNITY_NOT_FOUND
	}

	const authorized = await userCan(
		Capabilities.editCommunity,
		{ type: MembershipType.community, communityId: community.id },
		loginData.user.id
	)

	if (!authorized) {
		return ApiError.UNAUTHORIZED
	}

	try {
		await autoRevalidate(
			db.updateTable("forms").set({ isArchived: false }).where("forms.id", "=", id)
		).executeTakeFirstOrThrow()
	} catch (error) {
		return { error: "Unable to unarchive form", cause: error }
	}
})

export type HydrateMarkdownInput = {
	content: string
	element: typeof StructuralFormElement.p | null
}

export type HydrateMarkdownResult = {
	content: string
	hydrated: string
}

export const hydrateMarkdownForPreview = defineServerAction(
	async function hydrateMarkdownForPreview(elements: HydrateMarkdownInput[], pubId?: PubsId) {
		const loginData = await getLoginData()

		if (!loginData || !loginData.user) {
			return ApiError.NOT_LOGGED_IN
		}

		const community = await findCommunityBySlug()

		if (!community) {
			return ApiError.COMMUNITY_NOT_FOUND
		}

		const authorized = await userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			loginData.user.id
		)

		if (!authorized) {
			return ApiError.UNAUTHORIZED
		}

		let renderWithPubContext: RenderWithPubContext | undefined

		if (pubId) {
			const pub = await getPubsWithRelatedValues(
				{ pubId, communityId: community.id as CommunitiesId },
				{ withPubType: true, withStage: true }
			)

			if (pub) {
				const pubWithProsemirrorRichText = transformRichTextValuesToProsemirrorServer(pub, {
					toJson: true,
				})

				const member = loginData.user.memberships.find(
					(m) => m.communityId === community.id
				)

				if (member) {
					renderWithPubContext = {
						communityId: community.id as CommunitiesId,
						recipient: {
							...member,
							id: member.id,
							user: loginData.user,
						} as RenderWithPubContext["recipient"],
						communitySlug: community.slug,
						pub: pubWithProsemirrorRichText as RenderWithPubContext["pub"],
						trx: db,
					}
				}
			}
		}

		const results: HydrateMarkdownResult[] = await Promise.all(
			elements.map(async (el) => {
				if (el.element !== StructuralFormElement.p || !el.content) {
					return { content: el.content, hydrated: el.content }
				}

				try {
					const hydrated = renderWithPubContext
						? await renderMarkdownWithPub(el.content, renderWithPubContext)
						: await renderMarkdownAsHtml(el.content)
					return { content: el.content, hydrated }
				} catch {
					return { content: el.content, hydrated: el.content }
				}
			})
		)

		return results
	}
)
