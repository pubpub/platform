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

import type { FullProcessedPub } from "./types";
import type { FileUpload } from "~/lib/fields/fileUpload";
import { FileUploadPreview } from "~/app/components/forms/FileUpload";
import { getPubTitle } from "~/lib/pubs";

const PubValueHeading = ({
	depth,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement> & { depth: number }) => {
	switch (depth) {
		case 0:
			return <h3 {...props}>{children}</h3>;
		case 1:
			return <h4 {...props}>{children}</h4>;
		case 2:
			return <h5 {...props}>{children}</h5>;
		default:
			return <h6 {...props}>{children}</h6>;
	}
};

export const PubValues = ({ pub: { values, depth } }: { pub: FullProcessedPub }): ReactNode => {
	if (!values.length) {
		return null;
	}
	if (values.length === 1) {
		const value = values[0];
		return <PubValue value={value} />;
	}
	if (values.length > 1) {
		const filteredValues = values.filter((value) => {
			return value.fieldName !== "Title";
		});

		const groupedValues: Record<string, FullProcessedPub["values"]> = {};
		filteredValues.forEach((value) => {
			if (groupedValues[value.fieldName]) {
				groupedValues[value.fieldName].push(value);
			} else {
				groupedValues[value.fieldName] = [value];
			}
		});
		return Object.entries(groupedValues).map(([name, values]) => {
			return (
				<div className="my-2" key={name}>
					<PubValueHeading depth={depth} className={"mb-2 text-base font-semibold"}>
						{name}
					</PubValueHeading>
					<div className={"ml-2"} data-testid={`${name}-value`}>
						{values.map((value) => (
							<PubValue value={value} key={value.id} />
						))}
					</div>
				</div>
			);
		});
	}
};

const PubValue = ({ value }: { value: FullProcessedPub["values"][number] }) => {
	const [isOpen, setIsOpen] = useState(false);
	if (value.relatedPub) {
		const { relatedPub, ...justValue } = value;
		return (
			<Collapsible
				open={isOpen}
				onOpenChange={setIsOpen}
				// className="w-full"
			>
				<div>
					{justValue.value ? <>{<PubValue value={justValue} />}: </> : null}
					<Link className="mb-2 inline underline" href={`./${relatedPub.id}`}>
						{getPubTitle(value.relatedPub)}
					</Link>
					{value.relatedPub.depth < 3 && relatedPub.values.length && (
						<CollapsibleTrigger asChild>
							<Button
								variant={isOpen ? "secondary" : "ghost"}
								size="sm"
								aria-label="Expand pub contents"
							>
								{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
							</Button>
						</CollapsibleTrigger>
					)}
				</div>
				<CollapsibleContent>
					{value.relatedPub.depth < 3 && (
						<div className="ml-4">
							<PubValues pub={relatedPub} />
						</div>
					)}
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
