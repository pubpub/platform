import type { JsonValue } from "contracts"
import type {
	ActionInstances,
	CommunityMembershipsId,
	CoreSchemaType,
	PubFieldsId,
	PubsId,
	PubTypesId,
	Stages,
} from "db/public"

export type ChildPubRowPubType = {
	id: PubTypesId
	name: string
	fields: {
		id: PubFieldsId
		name: string
		schemaName: CoreSchemaType | null
	}[]
}

export type ChildPubRowMemberField = {
	id: CommunityMembershipsId
	fieldId: PubFieldsId
	user: {
		avatar: string | null
		email: string
		firstName: string
		lastName: string | null
	}
}

export type ChildPubRow = {
	id: PubsId
	createdAt: Date
	stages: Stages[]
	memberFields: ChildPubRowMemberField[]
	actionInstances: ActionInstances[]
	values: Record<string, JsonValue>
	pubTypeId: PubTypesId
}
