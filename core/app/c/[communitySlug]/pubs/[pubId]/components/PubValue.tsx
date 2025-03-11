"use client";

import type { ReactNode } from "react";

import { useState } from "react";
import Link from "next/link";
import { Value } from "@sinclair/typebox/value";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { JsonValue } from "contracts";
import { CoreSchemaType } from "db/public";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { ChevronDown, ChevronRight } from "ui/icon";

import type { FileUpload } from "~/lib/fields/fileUpload";
import type { FullProcessedPub } from "~/lib/server/pub";
import { FileUploadPreview } from "~/app/components/forms/FileUpload";
import { getPubTitle, valuesWithoutTitle } from "~/lib/pubs";

export const PubValue = ({
	value,
	relatedPubNode,
}: {
	value: FullProcessedPub["values"][number];
	relatedPubNode: ReactNode;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	if (value.relatedPub) {
		const { relatedPub, ...justValue } = value;
		const justValueElement = justValue.value ? (
			<span className="mr-2 italic">
				{<PubValue value={justValue} relatedPubNode={relatedPubNode} />}:
			</span>
		) : null;
		if (relatedPub.isCycle) {
			return (
				<>
					{justValueElement}
					{getPubTitle(value.relatedPub)}
					<span className="ml-2 rounded-full bg-green-100 px-2 py-1">Current pub</span>
				</>
			);
		}
		const renderRelatedValues =
			value.relatedPub.depth < 3 && valuesWithoutTitle(relatedPub).length > 0;
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
					{renderRelatedValues && <div className="ml-4">{relatedPubNode}</div>}
				</CollapsibleContent>
			</Collapsible>
		);
	}

	// Currently, we are only rendering string versions of fields, except for file uploads
	// For file uploads, because Unjournal doesn't have schemaNames yet, we check the value structure
	const fileUploadSchema = getJsonSchemaByCoreSchemaType(CoreSchemaType.FileUpload);
	if (Value.Check(fileUploadSchema, value.value)) {
		return <FileUploadPreview files={value.value as FileUpload} />;
	}

	if (value.schemaName === CoreSchemaType.DateTime) {
		const date = new Date(value.value as string);
		if (date.toString() !== "Invalid Date") {
			return date.toISOString().split("T")[0];
		}
	}

	const valueAsString = (value.value as JsonValue)?.toString() || "";

	let renderedField: ReactNode = valueAsString;
	if (value.schemaName === CoreSchemaType.URL) {
		renderedField = (
			<a className="underline" href={valueAsString} target="_blank" rel="noreferrer">
				{valueAsString}
			</a>
		);
	}

	return renderedField;
};
