import type { StringOptions, TString } from "@sinclair/typebox";

import { Type } from "@sinclair/typebox";

export const IdString = <T extends string>(options?: StringOptions) =>
	Type.String({
		format: "uuid",
		...options,
	}) as TString & {
		static: T;
	};
