"use client"

import type { ReactNode } from "react"

import { useState } from "react"
import Link from "next/link"
import { Value } from "@sinclair/typebox/value"
import { getJsonSchemaByCoreSchemaType } from "schemas"

import type { JsonValue } from "contracts"
import { CoreSchemaType } from "db/public"
import { Button } from "ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible"
import { ChevronDown, ChevronRight } from "ui/icon"

import type { FileUpload } from "~/lib/fields/fileUpload"
import type { FullProcessedPub } from "~/lib/server/pub"
import { FileUploadPreview } from "~/app/components/forms/FileUpload"
import { getPubTitle, valuesWithoutTitle } from "~/lib/pubs"

const PubValueHeading = ({
	depth,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement> & { depth: number }) => {
	// Pub depth starts at 1
	switch (depth - 1) {
		case 0:
			return <h2 {...props}>{children}</h2>
		case 1:
			return <h3 {...props}>{children}</h3>
		case 2:
			return <h4 {...props}>{children}</h4>
		default:
			return <h5 {...props}>{children}</h5>
	}
}

export const PubValues = ({ pub }: { pub: FullProcessedPub }): ReactNode => {
	const { values, depth } = pub
	if (!values.length) {
		return null
	}

	const filteredValues = valuesWithoutTitle(pub)

	// Group values by field so we only render one heading for relationship values that have multiple entries
	const groupedValues: Record<string, FullProcessedPub["values"]> = {}
	filteredValues.forEach((value) => {
		if (groupedValues[value.fieldName]) {
			groupedValues[value.fieldName].push(value)
		} else {
			groupedValues[value.fieldName] = [value]
		}
	})
	return Object.entries(groupedValues).map(([fieldName, fieldValues]) => {
		return (
			<div className="my-2" key={fieldName}>
				<PubValueHeading depth={depth} className={"mb-2 text-base font-semibold"}>
					{fieldName}
				</PubValueHeading>
				<div className={"ml-2"} data-testid={`${fieldName}-value`}>
					{fieldValues.map((value) => (
						<PubValue value={value} key={value.id} />
					))}
				</div>
			</div>
		)
	})
}

const PubValue = ({ value }: { value: FullProcessedPub["values"][number] }) => {
	const [isOpen, setIsOpen] = useState(false)
	if (value.relatedPub) {
		const { relatedPub, ...justValue } = value
		const justValueElement = justValue.value ? (
			<span className="mr-2 italic">{<PubValue value={justValue} />}:</span>
		) : null
		if (relatedPub.isCycle) {
			return (
				<>
					{justValueElement}
					{getPubTitle(value.relatedPub)}
					<span className="ml-2 rounded-full bg-green-100 px-2 py-1">Current pub</span>
				</>
			)
		}
		const renderRelatedValues =
			value.relatedPub.depth < 3 && valuesWithoutTitle(relatedPub).length > 0
		return (
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<div className="flex items-center">
					{justValueElement}
					<Link className="inline underline" href={`./${relatedPub.id}`}>
						{getPubTitle(value.relatedPub)}
					</Link>
					{renderRelatedValues && (
						<CollapsibleTrigger asChild>
							<Button
								variant={isOpen ? "secondary" : "ghost"}
								size="sm"
								title="Show pub contents"
								aria-label="Show pub contents"
								className="ml-2"
							>
								{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
							</Button>
						</CollapsibleTrigger>
					)}
				</div>
				<CollapsibleContent>
					{renderRelatedValues && (
						<div className="ml-4">
							<PubValues pub={relatedPub} />
						</div>
					)}
				</CollapsibleContent>
			</Collapsible>
		)
	}

	// Currently, we are only rendering string versions of fields, except for file uploads
	// For file uploads, because Unjournal doesn't have schemaNames yet, we check the value structure
	const fileUploadSchema = getJsonSchemaByCoreSchemaType(CoreSchemaType.FileUpload)
	if (Value.Check(fileUploadSchema, value.value)) {
		return <FileUploadPreview files={value.value as FileUpload} />
	}

	if (value.schemaName === CoreSchemaType.DateTime) {
		const date = new Date(value.value as string)
		if (date.toString() !== "Invalid Date") {
			return date.toISOString().split("T")[0]
		}
	}

	const valueAsString = (value.value as JsonValue)?.toString() || ""

	let renderedField: ReactNode = valueAsString
	if (value.schemaName === CoreSchemaType.URL) {
		renderedField = (
			<a className="underline" href={valueAsString} target="_blank" rel="noreferrer">
				{valueAsString}
			</a>
		)
	}

	return renderedField
}
