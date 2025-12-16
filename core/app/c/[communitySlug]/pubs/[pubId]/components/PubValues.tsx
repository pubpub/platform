import type { ProcessedPubWithForm } from "contracts"

import { type CommunityMembershipsId, CoreSchemaType } from "db/public"
import { Separator } from "ui/separator"

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
	const hydratedeValues = await Promise.all(
		pub.values.map(async (val) => {
			if (val.schemaName === CoreSchemaType.MemberId) {
				const member = await getMember(
					val.value as CommunityMembershipsId
				).executeTakeFirst()

				return {
					...val,
					value: member,
				}
			}

			return val
		})
	)

	const valuesGroupedByField = Object.groupBy(hydratedeValues, (val) => val.fieldSlug)

	return (
		<div className="grid grid-cols-12 gap-x-2 gap-y-4 text-sm">
			{Object.values(valuesGroupedByField).map((values, idx) => (
				<>
					<FieldBlock
						formSlug={formSlug}
						key={values[0]?.fieldId}
						pubId={pub.id}
						name={values[0]?.fieldName}
						slug={values[0]?.fieldSlug}
						schemaType={values[0]?.schemaName}
						values={values}
						depth={0}
					/>
					{idx < hydratedeValues.length - 1 && (
						<Separator className="col-span-12" key={`${values[0].fieldId}-divider`} />
					)}
				</>
			))}
		</div>
	)
}
