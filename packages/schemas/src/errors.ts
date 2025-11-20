import type { ErrorFunctionParameter } from "@sinclair/typebox/errors"

import { DefaultErrorFunction, SetErrorFunction } from "@sinclair/typebox/errors"

// It is possible to augument TB interfaces in the following way such that you get
// auto-complete and static checking for additional 'known' properties, but it is
// not possible (afaik) check for additional 'unknown' properties..
declare module "@sinclair/typebox" {
	export interface SchemaOptions {
		error?: string | ((error: ErrorFunctionParameter) => string)
	}
}

export const setErrorFunction = () =>
	SetErrorFunction((error) => {
		if (!("error" in error.schema) || error.schema.error == null) {
			return DefaultErrorFunction(error)
		}

		if (typeof error.schema.error === "function") {
			return error.schema.error(error)
		}

		return error.schema.error
	})
