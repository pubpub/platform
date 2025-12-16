import type { Communities, PubsId } from "db/public"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import type { Form } from "~/lib/server/form"
import type { RenderWithPubContext } from "~/lib/server/render/pub/renderWithPubUtils"

import { notFound, redirect } from "next/navigation"
import { randomUUID } from "node:crypto"

import { ElementType, FormAccessType, MemberRole } from "db/public"

import { Header } from "~/app/c/(public)/[communitySlug]/public/Header"
import { ContextEditorContextProvider } from "~/app/components/ContextEditor/ContextEditorContext"
import { FormElement } from "~/app/components/forms/FormElement"
import { FormElementToggleProvider } from "~/app/components/forms/FormElementToggleContext"
import {
	hydrateMarkdownElements,
	renderElementMarkdownContent,
} from "~/app/components/forms/structural"
import { PubFormProvider } from "~/app/components/providers/PubFormProvider"
import { SUBMIT_ID_QUERY_PARAM } from "~/app/components/pubs/PubEditor/constants"
import { SaveStatus } from "~/app/components/pubs/PubEditor/SaveStatus"
import { db } from "~/kysely/database"
import { getLoginData } from "~/lib/authentication/loginData"
import { getCommunityRole } from "~/lib/authentication/roles"
import { userCanCreatePub, userCanEditPub } from "~/lib/authorization/capabilities"
import { transformRichTextValuesToProsemirrorServer } from "~/lib/editor/serialize-server"
import { findCommunityBySlug } from "~/lib/server/community"
import { getForm } from "~/lib/server/form"
import { getPubsWithRelatedValues } from "~/lib/server/pub"
import { getPubTypesForCommunity } from "~/lib/server/pubtype"
import { capitalize } from "~/lib/string"
import { ExternalFormWrapper } from "./ExternalFormWrapper"
import { RequestLink } from "./RequestLink"

const NotFound = ({ children }: { children: ReactNode }) => {
	return <div className="w-full pt-8 text-center">{children}</div>
}

const Completed = ({ element }: { element: Form["elements"][number] | undefined }) => {
	return (
		<div data-testid="completed" className="flex w-full flex-col gap-2 pt-32 text-center">
			{element ? (
				<div
					className="prose self-center text-center"
					// Sanitize content
					dangerouslySetInnerHTML={{ __html: element.content ?? " " }}
				/>
			) : (
				<h2 className="font-semibold text-lg">Form Successfully Submitted</h2>
			)}
		</div>
	)
}

export type FormFillPageParams = { formSlug: string; communitySlug: string }

export type FormFillPageSearchParams = {
	pubId?: PubsId
	submitId?: string
	saveStatus?: string
} & ({ token: string; reason: string } | { token?: never; reason?: never })

const ExpiredTokenPage = ({
	params,
	searchParams,
	form,
	community,
}: {
	params: FormFillPageParams
	searchParams: FormFillPageSearchParams & { token: string }
	community: Communities
	form: Form
}) => {
	return (
		<div className="isolate min-h-screen">
			<Header>
				<div className="flex flex-col items-center">
					<h1 className="font-bold text-xl">
						{capitalize(form.name)} for {community?.name}
					</h1>
					<SaveStatus />
				</div>
			</Header>
			<div className="mx-auto mt-32 flex max-w-md flex-col items-center justify-center text-center">
				<h2 className="mb-2 font-semibold text-lg">Link Expired</h2>
				<p className="mb-6 text-sm">
					The link for this form has expired. Request a new one via email below to pick up
					right where you left off.
				</p>
				<RequestLink
					formSlug={params.formSlug}
					token={searchParams.token}
					// TODO: handle undefined pubId
					pubId={searchParams.pubId!}
				/>
			</div>
		</div>
	)
}

export async function generateMetadata(props: {
	params: Promise<FormFillPageParams>
	searchParams: Promise<FormFillPageSearchParams>
}): Promise<Metadata> {
	const params = await props.params
	const community = await findCommunityBySlug(params.communitySlug)

	if (!community) {
		return { title: "Community Not Found" }
	}

	const form = await getForm({
		slug: params.formSlug,
		communityId: community.id,
	}).executeTakeFirst()

	if (!form) {
		return { title: "Form Not Found" }
	}

	return {
		title: form.name,
	}
}

export default async function FormPage(props: {
	params: Promise<FormFillPageParams>
	searchParams: Promise<FormFillPageSearchParams>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
	const community = await findCommunityBySlug(params.communitySlug)

	if (!community) {
		return notFound()
	}
	const { user, session } = await getLoginData()

	const [form, pub, pubs, pubTypes] = await Promise.all([
		getForm({
			slug: params.formSlug,
			communityId: community.id,
		}).executeTakeFirst(),
		searchParams.pubId
			? await getPubsWithRelatedValues(
					{ pubId: searchParams.pubId, communityId: community.id },
					{ withStage: true, withPubType: true }
				)
			: undefined,
		getPubsWithRelatedValues(
			{ communityId: community.id, userId: user?.id },
			{
				limit: 30,
				withStage: true,
				withPubType: true,
			}
		),
		getPubTypesForCommunity(community.id, { limit: 0 }),
	])

	if (!form) {
		return <NotFound>No form found</NotFound>
	}

	if (searchParams.pubId && !pub) {
		return <NotFound>Pub not found</NotFound>
	}

	if (!user && !session) {
		if (form.access === "public") {
			// redirect user to signup/login
			redirect(
				`/c/${params.communitySlug}/public/signup?redirectTo=/c/${params.communitySlug}/public/forms/${params.formSlug}/fill`
			)
		}

		return (
			<ExpiredTokenPage
				params={params}
				searchParams={searchParams as FormFillPageSearchParams & { token: string }}
				form={form}
				community={community}
			/>
		)
	}

	const role = getCommunityRole(user, { slug: params.communitySlug })
	if (!role) {
		// user is not a member of the community, but is logged in, and the form is public
		if (form.access === "public") {
			redirect(
				`/c/${params.communitySlug}/public/signup?redirectTo=/c/${params.communitySlug}/public/forms/${params.formSlug}/fill`
			)
		}
		// TODO: show no access page
		return notFound()
	}

	// all other roles always have access to the form
	if (role === MemberRole.contributor && form.access !== FormAccessType.public) {
		const memberHasAccessToForm = pub
			? await userCanEditPub({
					formSlug: params.formSlug,
					userId: user.id,
					pubId: pub.id,
				})
			: await userCanCreatePub({
					userId: user.id,
					communityId: community.id,
					// When the form is in create mode (there's no pub), just pass the form's pubType since
					// the user doesn't control the type.
					pubTypeId: form.pubTypeId,
				})

		if (!memberHasAccessToForm) {
			// TODO: show no access page
			return notFound()
		}
	}

	const member = user.memberships.find((m) => m.communityId === community?.id)

	// if you eg access this as a superadmin
	if (!member) {
		return notFound()
	}
	const pubWithProsemirrorRichText = pub
		? transformRichTextValuesToProsemirrorServer(pub, { toJson: true })
		: undefined

	const memberWithUser = {
		...member,
		id: member.id,
		user: {
			...user,
			id: user.id,
		},
	}

	const submitId: string | undefined = searchParams[SUBMIT_ID_QUERY_PARAM]
	const submitElement = form.elements.find(
		(e) => e.type === ElementType.button && e.id === submitId
	)

	const renderWithPubContext = {
		communityId: community.id,
		recipient: memberWithUser,
		communitySlug: params.communitySlug,
		pub,
		trx: db,
	}

	if (submitId && submitElement) {
		// The post-submission page will only render once we have a pub
		if (pubWithProsemirrorRichText) {
			submitElement.content = await renderElementMarkdownContent(
				submitElement,
				renderWithPubContext as RenderWithPubContext
			)
		}
	} else {
		await hydrateMarkdownElements({
			elements: form.elements,
			renderWithPubContext: pubWithProsemirrorRichText
				? (renderWithPubContext as RenderWithPubContext)
				: undefined,
		})
	}

	const mode = pubWithProsemirrorRichText ? "edit" : "create"
	const withAutoSave = mode === "edit"

	const pubId = pubWithProsemirrorRichText?.id ?? (randomUUID() as PubsId)
	const pubForForm = pubWithProsemirrorRichText ?? {
		id: pubId,
		values: [],
		pubTypeId: form.pubTypeId,
	}
	// For the Context, we want both the pubs from the initial pub query (which is limited)
	// as well as the pubs related to this pub
	const relatedPubs = pubWithProsemirrorRichText
		? pubWithProsemirrorRichText.values.flatMap((v) => (v.relatedPub ? [v.relatedPub] : []))
		: []
	const pubsForContext = [...pubs, ...relatedPubs]

	return (
		<div className="isolate min-h-screen">
			<Header>
				<div className="flex flex-col items-center">
					<h1 className="font-bold text-xl">
						{capitalize(form.name)} for {community?.name}
					</h1>
					<SaveStatus autosave={withAutoSave} />
				</div>
			</Header>
			<div className="container mx-auto">
				{submitId ? (
					<Completed element={submitElement} />
				) : (
					<div className="grid grid-cols-4 px-6 py-12">
						<PubFormProvider
							form={{
								pubId,
								form,
								mode,
								isExternalForm: true,
							}}
						>
							<FormElementToggleProvider
								fieldSlugs={form.elements.reduce(
									(acc, e) => (e.slug ? [...acc, e.slug] : acc), // map to element.slug and filter out the undefined ones
									[] as string[]
								)}
							>
								<ContextEditorContextProvider
									pubId={pubId}
									pubTypeId={form.pubTypeId}
									pubs={pubsForContext}
									pubTypes={pubTypes}
								>
									<ExternalFormWrapper
										pub={pubForForm}
										elements={form.elements}
										formSlug={form.slug}
										mode={mode}
										withAutoSave={withAutoSave}
										withButtonElements
										isExternalForm
										className="col-span-2 col-start-2"
									>
										{form.elements.map((e) => (
											<FormElement
												key={e.id}
												pubId={pubId}
												element={e}
												values={
													pubWithProsemirrorRichText
														? pubWithProsemirrorRichText.values
														: []
												}
											/>
										))}
									</ExternalFormWrapper>
								</ContextEditorContextProvider>
							</FormElementToggleProvider>
						</PubFormProvider>
					</div>
				)}
			</div>
		</div>
	)
}
