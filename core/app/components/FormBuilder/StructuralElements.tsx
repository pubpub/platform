import type { ZodSchema } from "zod";

import { z } from "zod";

import type { LucideIcon } from "ui/icon";
import { StructuralFormElement } from "db/public";
import { CaseSensitive, Heading2, Heading3, Minus } from "ui/icon";

import { markdown } from "../../../actions/_lib/zodTypes";

export const structuralElements: Record<
	StructuralFormElement,
	{ Icon: LucideIcon; schema: ZodSchema; enabled: boolean; name: string }
> = {
	[StructuralFormElement.p]: {
		Icon: CaseSensitive,
		schema: z.object({ content: markdown() }),
		enabled: true,
		name: "Paragraph",
	},
	[StructuralFormElement.h2]: {
		Icon: Heading2,
		schema: z.any(),
		enabled: false,
		name: "Heading 2",
	},
	[StructuralFormElement.h3]: {
		Icon: Heading3,
		schema: z.any(),
		enabled: false,
		name: "Heading 3",
	},
	[StructuralFormElement.hr]: { Icon: Minus, schema: z.any(), enabled: false, name: "Divider" },
} as const;
