import type { ProcessedPubWithForm } from "contracts"

import { type CommunityMembershipsId, CoreSchemaType } from "db/public"

import { getMember } from "~/lib/server/user"
import { FieldBlock } from "./FieldBlock"

type FullProcessedPubWithForm = ProcessedPubWithForm<{
	withRelatedPubs: true
	withStage: true
	withPubType: true
	withMembers: true
}>

export const PubValues = async ({
	pub,
	isNested,
	formSlug,
}: {
	pub: FullProcessedPubWithForm
	/**
	 * If this is a nested related pub. This can likely be removed once we have related pubs
	 * using default forms as well, as right now we only need it to not render
	 * the "Other fields" header which will always show up since related pubs do not have
	 * forms joined currently
	 **/
	isNested?: boolean
	formSlug: string
}) => {
	const valuesWithMembers = await Promise.all(
		pub.values.map(async (val) => {
			if (val.schemaName !== CoreSchemaType.MemberId) {
				return val
			}

			const member = await getMember(val.value as CommunityMembershipsId).executeTakeFirst()

			return {
				...val,
				value: member,
			}
		})
	)

	return (
		<div className="grid grid-cols-12 gap-x-2 gap-y-4 text-sm">
			{valuesWithMembers.map((value) => (
				<FieldBlock
					formSlug={formSlug}
					key={value.id}
					pubId={pub.id}
					name={value.fieldName}
					slug={value.fieldSlug}
					schemaType={value.schemaName}
					values={[value]}
					depth={0}
				/>
			))}
		</div>
	)
}
