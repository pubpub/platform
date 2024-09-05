import type { LucideIcon } from "lucide-react";

import {
	BoxSelect,
	CalendarClock,
	CheckSquare,
	ImagePlus,
	Link,
	Mail,
	Type,
	User,
} from "lucide-react";

import { CoreSchemaType } from "db/public";

export const SCHEMA_TYPES_WITH_ICONS: Record<
	CoreSchemaType,
	{
		description: string;
		icon: LucideIcon;
	}
> = {
	[CoreSchemaType.Boolean]: {
		description: "A true or false value",
		icon: CheckSquare,
	},
	[CoreSchemaType.String]: {
		description: "Text of any length",
		icon: Type,
	},
	[CoreSchemaType.DateTime]: {
		description: "A moment in time",
		icon: CalendarClock,
	},
	[CoreSchemaType.Email]: {
		description: "An email address",
		icon: Mail,
	},
	[CoreSchemaType.FileUpload]: {
		description: "A file uploader",
		icon: ImagePlus,
	},
	[CoreSchemaType.URL]: {
		description: "A link to a website",
		icon: Link,
	},
	[CoreSchemaType.MemberId]: {
		description: "A member of your community",
		icon: User,
	},
	[CoreSchemaType.Vector3]: {
		description: "A set of 3 numbers",
		icon: BoxSelect,
	},
} as const;
