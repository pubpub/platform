import type { PubFieldFormElementProps } from "./PubFieldFormElement"
import type { FormElements } from "./types"

import { ElementType } from "db/public"
import { expect } from "utils"

import { RelatedPubsElement } from "./elements/RelatedPubsElement"
import { FormElementToggle } from "./FormElementToggle"
import { PubFieldFormElement } from "./PubFieldFormElement"

export type FormElementProps = Omit<PubFieldFormElementProps, "element"> & {
	element: FormElements
}

export const MaybeWithToggle = (
	props: Parameters<typeof FormElementToggle>[0] & { required: boolean | null }
) => {
	if (!props.children) {
		return null
	}

	if (props.required) {
		return props.children
	}
	return <FormElementToggle {...props}>{props.children}</FormElementToggle>
}

export const FormElement = ({ pubId, element, values }: FormElementProps) => {
	if (!element.slug) {
		if (element.type === ElementType.structural) {
			return (
				<div
					className="prose-sm dark:prose-invert"
					// TODO: sanitize content
					dangerouslySetInnerHTML={{ __html: expect(element.content) }}
				/>
			)
		}
		return null
	}

	if (!element.schemaName) {
		return null
	}

	const configLabel =
		element.isRelation && "relationshipConfig" in element.config
			? element.config.relationshipConfig.label
			: element.config.label

	const basicProps = {
		label: configLabel || element.label || element.slug,
		slug: element.slug,
	}

	if (element.isRelation) {
		return (
			<MaybeWithToggle {...basicProps} required={element.required}>
				<RelatedPubsElement
					{...basicProps}
					config={element.config}
					schemaName={element.schemaName}
					valueComponentProps={{
						pubId,
						element,
						values,
					}}
				/>
			</MaybeWithToggle>
		)
	}

	return (
		<MaybeWithToggle {...basicProps} required={element.required}>
			<PubFieldFormElement pubId={pubId} element={element} values={values} {...basicProps} />
		</MaybeWithToggle>
	)
}
