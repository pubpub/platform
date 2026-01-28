"use client"

import type { Monaco } from "@monaco-editor/react"
import type { MonacoLanguage, ValidationResult } from "./types"

import * as React from "react"
import { loader } from "@monaco-editor/react"

import { createJsonataLanguageDefinition, defineJsonataThemes } from "./languages/jsonata"
import { validateJson, validateJsonata } from "./validation"

let monacoInstance: Monaco | null = null
let languagesRegistered = false

export const initializeMonaco = async (): Promise<Monaco> => {
	if (monacoInstance) return monacoInstance

	monacoInstance = await loader.init()

	if (!languagesRegistered) {
		monacoInstance.languages.register({ id: "jsonata", aliases: ["JSONata", "jsonata"] })
		monacoInstance.languages.setMonarchTokensProvider(
			"jsonata",
			createJsonataLanguageDefinition()
		)
		defineJsonataThemes(monacoInstance)
		languagesRegistered = true
	}

	return monacoInstance
}

export const useMonaco = () => {
	const [monaco, setMonaco] = React.useState<Monaco | null>(null)

	React.useEffect(() => {
		let cancelled = false
		void initializeMonaco().then((m) => {
			if (!cancelled) setMonaco(m)
		})
		return () => {
			cancelled = true
		}
	}, [])

	return monaco
}

export const useValidation = (
	value: string,
	language: MonacoLanguage,
	onValidate?: (result: ValidationResult) => void
) => {
	const [validation, setValidation] = React.useState<ValidationResult>({
		valid: true,
		errors: [],
	})

	const onValidateRef = React.useRef(onValidate)
	onValidateRef.current = onValidate

	React.useEffect(() => {
		let cancelled = false

		const validate = async () => {
			let errors: import("./types").ValidationError[] = []

			if (language === "jsonata") {
				errors = await validateJsonata(value)
			} else if (language === "json") {
				errors = validateJson(value)
			}

			if (cancelled) return

			const result = { valid: errors.length === 0, errors }
			setValidation(result)
			onValidateRef.current?.(result)
		}

		const timeoutId = setTimeout(validate, 300)
		return () => {
			cancelled = true
			clearTimeout(timeoutId)
		}
	}, [value, language])

	return validation
}
