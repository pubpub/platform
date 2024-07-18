import * as React from "react";
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

import { CoreSchemaType } from "./CoreSchemaType";

export const SCHEMA_TYPES_WITH_ICONS: Record<
	CoreSchemaType,
	{ description: string; icon: React.ReactNode }
> = {
	[CoreSchemaType.Boolean]: {
		description: "A true or false value",
		icon: <CheckSquare className="w-4" />,
	},
	[CoreSchemaType.String]: {
		description: "Text of any length",
		icon: <Type className="w-4" />,
	},
	[CoreSchemaType.DateTime]: {
		description: "A moment in time",
		icon: <CalendarClock className="w-4" />,
	},
	[CoreSchemaType.Email]: { description: "An email address", icon: <Mail className="w-4" /> },
	[CoreSchemaType.FileUpload]: {
		description: "A file uploader",
		icon: <ImagePlus className="w-4" />,
	},
	[CoreSchemaType.URL]: {
		description: "A link to a website",
		icon: <Link className="w-4" />,
	},
	[CoreSchemaType.UserId]: {
		description: "A PubPub user ID",
		icon: <User className="w-4" />,
	},
	[CoreSchemaType.Vector3]: {
		description: "A set of 3 numbers",
		icon: <BoxSelect className="w-4" />,
	},
} as const;
