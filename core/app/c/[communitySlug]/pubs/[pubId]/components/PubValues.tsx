"use server";

import { cn } from "utils";

import type { Form } from "~/lib/server/form";
import type { FullProcessedPub } from "~/lib/server/pub";
import { getTitleField, valuesWithoutTitle } from "~/lib/pubs";
import { getForm } from "~/lib/server/form";
import { PubValue } from "./PubValue";

const PubValueHeading = ({
	depth,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement> & { depth: number }) => {
	// For "Other Fields" section header which might be one lower than any pub depth
	if (depth < 1) {
		return <h1 {...props}>{children}</h1>;
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

const PubValueServer = async ({ value }: { value: FullProcessedPub["values"][number] }) => {
	const { relatedPub } = value;
	const form = relatedPub
		? await getForm({
				communityId: relatedPub.communityId,
				pubTypeId: relatedPub.pubTypeId,
			}).executeTakeFirstOrThrow()
		: undefined;

	if (value.relatedPub && form) {
		return (
			<PubValue
				value={value}
				relatedPubNode={<PubValues pub={value.relatedPub} form={form} />}
			/>
		);
	}
	return <PubValue value={value} relatedPubNode={null} />;
};

const FieldBlock = async ({
	name,
	values,
	depth,
}: {
	name: string;
	values: FullProcessedPub["values"] | undefined;
	depth: number;
}) => {
	return (
		<div className="my-2">
			<PubValueHeading
				depth={depth}
				className={"mb-2 text-base font-semibold"}
				data-testid="pub-value-heading"
			>
				{name}
			</PubValueHeading>
			<div
				className={cn("ml-2", {
					"mb-6": !values, // leave a gap for when there are no values
				})}
				data-testid={`${name}-value`}
			>
				{values?.map((value) => <PubValueServer value={value} key={value.id} />)}
			</div>
		</div>
	);
};

export const PubValues = async ({ pub, form }: { pub: FullProcessedPub; form?: Form }) => {
	const { values, depth } = pub;
	if (!values.length) {
		return null;
	}

	const titleField = getTitleField(pub);
	const filteredValues = valuesWithoutTitle(pub);

	// Group values by field so we only render one heading for relationship values that have multiple entries
	const groupedValues: Record<string, { name: string; values: FullProcessedPub["values"] }> = {};
	filteredValues.forEach((value) => {
		if (groupedValues[value.fieldSlug]) {
			groupedValues[value.fieldSlug].values.push(value);
		} else {
			groupedValues[value.fieldSlug] = { name: value.fieldName, values: [value] };
		}
	});

	// Can hopefully remove this later
	if (!form) {
		return Object.entries(groupedValues).map(([fieldName, { values }]) => {
			return <FieldBlock key={fieldName} name={fieldName} values={values} depth={depth} />;
		});
	}
	const valuesNotInForm = Object.entries(groupedValues)
		.filter(([slug]) => {
			return !form.elements.find((e) => e.slug === slug);
		})
		.map(([slug, { name, values }]) => {
			return { slug, name, values };
		});

	return (
		<div>
			{/* Form elements */}
			{form.elements.map((element) => {
				if (!element.slug) {
					return null;
				}
				if (element.slug === titleField?.slug) {
					return null;
				}
				const configLabel = "label" in element.config ? element.config.label : undefined;
				const grouped = groupedValues[element.slug];
				const label = configLabel || element.label || grouped?.name || element.slug;

				return (
					<FieldBlock
						key={element.id}
						name={label}
						values={grouped?.values}
						depth={depth}
					/>
				);
			})}
			{/* Pub values not in the form. TODO: check for perms */}
			{valuesNotInForm.length ? (
				<div className="flex flex-col gap-2">
					<hr className="mt-2" />
					<PubValueHeading depth={depth - 1} className="text-lg font-semibold">
						Other Fields
					</PubValueHeading>
					{valuesNotInForm.map(({ slug, name, values }) => (
						<FieldBlock key={slug} name={name} values={values} depth={depth} />
					))}
				</div>
			) : null}
		</div>
	);
};
