import type { ProcessedPubWithForm } from "contracts"

import { Fragment } from "react"

import { type CommunityMembershipsId, CoreSchemaType } from "db/public"
import { Separator } from "ui/separator"

import { getMember } from "~/lib/server/user"
import { FieldRow, type PubValue } from "./FieldRow"

type FullProcessedPubWithForm = ProcessedPubWithForm<{
	withRelatedPubs: true
	withStage: true
	withPubType: true
	withMembers: true
}>

export const PubValues = async ({
	pub,
	formSlug,
}: {
	pub: FullProcessedPubWithForm
	formSlug: string
}) => {
	const hydratedValues = await Promise.all(
		pub.values.map(async (val) => {
			if (val.schemaName === CoreSchemaType.MemberId) {
				const member = await getMember(
					val.value as CommunityMembershipsId
				).executeTakeFirst()

				return { ...val, value: member }
			}
			return val
		})
	)

	const valuesGroupedByField = Object.groupBy(hydratedValues, (val) => val.fieldSlug)
	const fieldGroups = Object.values(valuesGroupedByField).filter(
		(values): values is NonNullable<typeof values> => Boolean(values?.length)
	)

	return (
		<div className="grid grid-cols-14 gap-x-2 gap-y-3 text-sm">
			{fieldGroups.map((values, idx) => (
				<Fragment key={`field-row-${values[0].id}-${idx}`}>
					<FieldRow
						formSlug={formSlug}
						pubId={pub.id}
						name={values[0].fieldName}
						slug={values[0].fieldSlug}
						schemaType={values[0].schemaName}
						values={values as PubValue[]}
						depth={0}
					/>

					{idx < fieldGroups.length - 1 && <Separator className="col-span-14" />}
				</Fragment>
			))}
		</div>
	)
}
