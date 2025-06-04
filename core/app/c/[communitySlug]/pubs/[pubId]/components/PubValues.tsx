"use client";

import type { ReactNode } from "react";

import { useState } from "react";
import Link from "next/link";
import { Value } from "@sinclair/typebox/value";
import partition from "lodash.partition";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { JsonValue, ProcessedPubWithForm } from "contracts";
import { CoreSchemaType } from "db/public";
import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { ColorCircle, ColorLabel, ColorValue } from "ui/color";
import { ChevronDown, ChevronRight } from "ui/icon";
import { ShowMore } from "ui/show-more";

import { FileUploadPreview } from "~/app/components/forms/FileUpload";
import { getPubTitle, valuesWithoutTitle } from "~/lib/pubs";

type FullProcessedPubWithForm = ProcessedPubWithForm<{
	withRelatedPubs: true;
	withStage: true;
	withPubType: true;
	withMembers: true;
}>;

const PubValueHeading = ({
	depth,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement> & { depth: number }) => {
	// For "Other Fields" section header which might be one lower than any pub depth
	if (depth < 1) {
		return <h2 {...props}>{children}</h2>;
	}
	// Pub depth starts at 1
	switch (depth - 1) {
		case 0:
			return <h2 {...props}>{children}</h2>;
		case 1:
			return <h3 {...props}>{children}</h3>;
		case 2:
			return <h4 {...props}>{children}</h4>;
		default:
			return <h5 {...props}>{children}</h5>;
	}
};

const FieldBlock = ({
	name,
	values,
	depth,
}: {
	name: string;
	values: FullProcessedPubWithForm["values"];
	depth: number;
}) => {
	return (
		<div className="my-2" key={name}>
			<PubValueHeading depth={depth} className={"mb-2 text-base font-semibold"}>
				{name}
			</PubValueHeading>
			<div className={"ml-2"} data-testid={`${name}-value`}>
				{values.map((value) =>
					value.id ? (
						<PubValue value={value} key={value.id} />
					) : (
						// Blank space if there is no value
						<div className="h-1" key={value.fieldId} />
					)
				)}
			</div>
		</div>
	);
};

export const PubValues = ({
	pub,
	isNested,
}: {
	pub: FullProcessedPubWithForm;
	/**
	 * If this is a nested related pub. This can likely be removed once we have related pubs
	 * using default forms as well, as right now we only need it to not render
	 * the "Other fields" header which will always show up since related pubs do not have
	 * forms joined currently
	 **/
	isNested?: boolean;
}): ReactNode => {
	const { values, depth } = pub;
	if (!values.length) {
		return null;
	}

	const filteredValues = valuesWithoutTitle(pub);

	// Group values by field so we only render one heading for relationship values that have multiple entries
	const groupedValues: Record<
		string,
		{ label: string; isInForm: boolean; values: FullProcessedPubWithForm["values"] }
	> = {};
	filteredValues.forEach((value) => {
		if (groupedValues[value.fieldSlug]) {
			groupedValues[value.fieldSlug].values.push(value);
		} else {
			const label = getLabel(value);
			const isInForm = "formElementId" in value;
			groupedValues[value.fieldSlug] = { label, values: [value], isInForm };
		}
	});

	const [valuesInForm, valuesNotInForm] = partition(
		Object.values(groupedValues),
		(values) => values.isInForm
	);
	return (
		<article>
			{valuesInForm.map(({ label, values }) => {
				return <FieldBlock key={label} name={label} values={values} depth={depth} />;
			})}
			{valuesNotInForm.length ? (
				<div className="flex flex-col gap-2">
					{valuesInForm.length ? <hr className="mt-2" /> : null}
					{!isNested ? (
						<PubValueHeading depth={depth - 1} className="text-lg font-semibold">
							Other Fields
						</PubValueHeading>
					) : null}
					{valuesNotInForm.map(({ label, values }) => (
						<FieldBlock key={label} name={label} values={values} depth={depth} />
					))}
				</div>
			) : null}
		</article>
	);
};

const PubValue = ({ value }: { value: FullProcessedPubWithForm["values"][number] }) => {
	const [isOpen, setIsOpen] = useState(false);
	if (value.relatedPub) {
		const { relatedPub, ...justValue } = value;
		const justValueElement = justValue.value ? (
			<span className="mr-2 italic">{<PubValue value={justValue} />}:</span>
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
					{renderRelatedValues && (
						<div className="ml-4">
							<PubValues pub={relatedPub} isNested />
						</div>
					)}
				</CollapsibleContent>
			</Collapsible>
		);
	}

	const fileUploadSchema = getJsonSchemaByCoreSchemaType(CoreSchemaType.FileUpload);
	if (Value.Check(fileUploadSchema, value.value)) {
		return <FileUploadPreview files={value.value} />;
	}

	if (value.schemaName === CoreSchemaType.DateTime) {
		const date = new Date(value.value as string);
		if (date.toString() !== "Invalid Date") {
			return date.toISOString().split("T")[0];
		}
	}

	if (value.schemaName === CoreSchemaType.RichText) {
		return (
			<ShowMore animate={false}>
				<div
					className="prose prose-sm"
					dangerouslySetInnerHTML={{ __html: value.value as string }}
				/>
			</ShowMore>
		);
	}

	if (value.schemaName === CoreSchemaType.Color) {
		return (
			<ColorLabel>
				<ColorCircle color={value.value as string} size="sm" />
				<ColorValue color={value.value as string} />
			</ColorLabel>
		);
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
