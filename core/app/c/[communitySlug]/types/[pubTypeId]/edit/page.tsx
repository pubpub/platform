import type { PubTypesId } from "db/public"

import { cache } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Capabilities, MembershipType } from "db/public"
import {
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "ui/breadcrumb"
import { Button } from "ui/button"
import { ToyBrick } from "ui/icon"
import { PubFieldProvider } from "ui/pubFields"

import { SaveFormButton } from "~/app/components/FormBuilder/SaveFormButton"
import { getPageLoginData } from "~/lib/authentication/loginData"
import { userCan } from "~/lib/authorization/capabilities"
import { getPubType, getPubTypesForCommunity } from "~/lib/server"
import { findCommunityBySlug } from "~/lib/server/community"
import { redirectToLogin } from "~/lib/server/navigation/redirects"
import { getPubFields } from "~/lib/server/pubFields"
import {
	ContentLayoutActions,
	ContentLayoutBody,
	ContentLayoutHeader,
	ContentLayoutRoot,
	ContentLayoutTitle,
} from "../../../ContentLayout"
import { UpdatePubTypeButton } from "../../UpdatePubTypeDialog"
import { TypeBuilder } from "./TypeBuilder"

const getPubTypeCached = cache(async (pubTypeId: PubTypesId) => {
	return getPubType(pubTypeId).executeTakeFirstOrThrow()
})

export const generateMetadata = async ({
	params,
}: {
	params: Promise<{ pubTypeId: PubTypesId }>
}) => {
	const { pubTypeId } = await params
	const pubType = await getPubTypeCached(pubTypeId)

	if (!pubType) {
		notFound()
	}

	return {
		title: `${pubType.name} [Type]`,
	}
}

export default async function Page(props: {
	params: Promise<{
		pubTypeId: PubTypesId
		communitySlug: string
	}>
}) {
	const params = await props.params

	const { pubTypeId, communitySlug } = params
	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	])

	if (!community) {
		notFound()
	}

	if (!user) {
		redirectToLogin()
	}

	const [canEditPubType, pubType, { fields }, _pubTypes] = await Promise.all([
		await userCan(
			Capabilities.editPubType,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		),

		getPubType(pubTypeId).executeTakeFirstOrThrow(),
		getPubFields({ communityId: community.id }).executeTakeFirstOrThrow(),
		getPubTypesForCommunity(community.id, { limit: 0 }),
	])

	if (!canEditPubType) {
		redirect(`/c/${communitySlug}/unauthorized`)
	}

	const pubtypebuilderId = "pubtypebuilder"

	return (
		<PubFieldProvider pubFields={fields}>
			<ContentLayoutRoot>
				<ContentLayoutHeader>
					<ContentLayoutTitle>
						<ToyBrick />
						<BreadcrumbList className="text-lg">
							<BreadcrumbItem>
								<BreadcrumbLink
									className="font-normal text-muted-foreground"
									asChild
								>
									<Link href={`/c/${communitySlug}/types`}>Types</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="mt-1" />
							<BreadcrumbPage className="font-bold">{pubType.name}</BreadcrumbPage>
						</BreadcrumbList>
						{pubType.description && (
							<div className="font-normal text-muted-foreground text-sm">
								{pubType.description}
							</div>
						)}
						<UpdatePubTypeButton
							pubTypeId={pubTypeId}
							name={pubType.name}
							description={pubType.description}
						>
							<Button
								variant="link"
								size="sm"
								className="ml-2 h-auto p-0 text-blue-500 underline hover:text-blue-600"
							>
								Edit
							</Button>
						</UpdatePubTypeButton>
					</ContentLayoutTitle>
					<ContentLayoutActions>
						<SaveFormButton form={pubtypebuilderId} />
					</ContentLayoutActions>
				</ContentLayoutHeader>
				<ContentLayoutBody>
					<TypeBuilder pubType={pubType} formId={pubtypebuilderId} />
				</ContentLayoutBody>
			</ContentLayoutRoot>
		</PubFieldProvider>
	)
}
