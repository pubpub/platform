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
import { InputComponent } from "db/src/public/InputComponent";

export type SchemaComponentData = {
	component: InputComponent;
	name?: string;
	placeholder?: string;
};

export const SCHEMA_TYPES_WITH_ICONS: Record<
	CoreSchemaType,
	{
		description: string;
		icon: LucideIcon;
		components: SchemaComponentData | SchemaComponentData[];
	}
> = {
	[CoreSchemaType.Boolean]: {
		description: "A true or false value",
		icon: CheckSquare,
		components: { component: InputComponent.boolean },
	},
	[CoreSchemaType.String]: {
		description: "Text of any length",
		icon: Type,
		components: [
			{ component: InputComponent.textArea, name: "Textarea", placeholder: "For long text" },
			{ component: InputComponent.textInput, name: "Input", placeholder: "For short text" },
		],
	},
	[CoreSchemaType.DateTime]: {
		description: "A moment in time",
		icon: CalendarClock,
		components: { component: InputComponent.date },
	},
	[CoreSchemaType.Email]: {
		description: "An email address",
		icon: Mail,
		components: { component: InputComponent.textInput },
	},
	[CoreSchemaType.FileUpload]: {
		description: "A file uploader",
		icon: ImagePlus,
		components: { component: InputComponent.fileUpload },
	},
	[CoreSchemaType.URL]: {
		description: "A link to a website",
		icon: Link,
		components: { component: InputComponent.textInput },
	},
	[CoreSchemaType.MemberId]: {
		description: "A member of your community",
		icon: User,
		components: { component: InputComponent.memberSelect },
	},
	[CoreSchemaType.Vector3]: {
		description: "A set of 3 numbers",
		icon: BoxSelect,
		components: { component: InputComponent.confidenceInterval },
	},
} as const;
