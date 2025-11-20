import type { Static } from "@sinclair/typebox"

import { Type } from "@sinclair/typebox"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { registerFormats } from "schemas"

registerFormats()

const signupFormSchema = Type.Object({
	firstName: Type.String(),
	lastName: Type.String(),
	email: Type.String({ format: "email" }),
	password: Type.String({
		minLength: 8,
		maxLength: 72,
	}),
})

export const compiledSignupFormSchema = TypeCompiler.Compile(signupFormSchema)

export type SignupFormSchema = Static<typeof signupFormSchema>
