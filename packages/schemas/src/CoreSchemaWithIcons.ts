import type { LucideIcon } from "lucide-react";

import {
	BookType,
	BoxSelect,
	CalendarClock,
	CheckSquare,
	CircleSlash,
	Hash,
	ImagePlus,
	Link,
	Mail,
	Palette,
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
	[CoreSchemaType.Number]: {
		description: "A numeric value",
		icon: Hash,
	},
	[CoreSchemaType.StringArray]: {
		description: "An array of strings",
		icon: Type,
	},
	[CoreSchemaType.NumericArray]: {
		description: "An array of numbers",
		icon: Hash,
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
	[CoreSchemaType.Null]: {
		description: "An empty value",
		icon: CircleSlash,
	},
	[CoreSchemaType.RichText]: {
		description: "Rich text of any length",
		icon: BookType,
	},
	[CoreSchemaType.Color]: {
		description: "A color",
		icon: Palette,
	},
} as const;
