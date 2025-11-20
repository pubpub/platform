import type { PubFields } from "db/public"
import type { LucideIcon } from "ui/icon"

import { SCHEMA_TYPES_WITH_ICONS } from "schemas"

import { BookDashed, Type } from "ui/icon"

export const FieldIcon = ({
	field,
	className,
}: {
	field: Pick<PubFields, "schemaName" | "isRelation">
	className?: string
}) => {
	let Icon: LucideIcon
	if (!field.schemaName) {
		Icon = Type
	} else if (field.isRelation) {
		Icon = BookDashed
	} else {
		Icon = SCHEMA_TYPES_WITH_ICONS[field.schemaName].icon
	}

	return <Icon size={20} className={className} />
}
