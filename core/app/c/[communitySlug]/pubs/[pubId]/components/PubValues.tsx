import type { ReactNode } from "react";

import { config } from "dotenv";

import type { Form } from "~/lib/server/form";
import type { FullProcessedPub } from "~/lib/server/pub";
import { PubValue } from "./PubValue";

const PubValueHeading = ({
	depth,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement> & { depth: number }) => {
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

// const PubValueServer = async ({ value }: { value: FullProcessedPub["values"][number] }) => {
// 	const { relatedPub } = value;
// 	const form = relatedPub
// 		? await getForm({
// 				communityId: relatedPub.communityId,
// 				pubTypeId: relatedPub.pubTypeId,
// 			}).executeTakeFirstOrThrow()
// 		: undefined;

// 	if (value.relatedPub && form) {
// 		return (
// 			<PubValue
// 				value={value}
// 				relatedPubNode={<PubValues pub={value.relatedPub} form={form} />}
// 			/>
// 		);
// 	}
// 	return <PubValue value={value} relatedPubNode={null} />;
// };

const FieldBlock = ({
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
			<div className={"ml-2"} data-testid={`${name}-value`}>
				{values?.map((value) => <PubValue value={value} key={value.id} />)}
			</div>
		</div>
	);
};

export const PubValues = ({ pub, form }: { pub: FullProcessedPub; form?: Form }): ReactNode => {
	const { values, depth } = pub;
	if (!values.length) {
		return null;
	}

	// Group values by field so we only render one heading for relationship values that have multiple entries
	const groupedValues: Record<string, FullProcessedPub["values"]> = {};
	values.forEach((value) => {
		if (groupedValues[value.fieldSlug]) {
			groupedValues[value.fieldSlug].push(value);
		} else {
			groupedValues[value.fieldSlug] = [value];
		}
	});

	// Can hopefully remove this later
	if (!form) {
		return Object.entries(groupedValues).map(([fieldName, fieldValues]) => {
			return (
				<FieldBlock key={fieldName} name={fieldName} values={fieldValues} depth={depth} />
			);
		});
	}
	return form.elements.map((element) => {
		if (!element.slug) {
			return null;
		}
		const configLabel = "label" in element.config ? element.config.label : undefined;
		const label = configLabel || element.label || element.fieldName || element.slug;
		const values = groupedValues[element.slug];
		return <FieldBlock key={element.id} name={label} values={values} depth={depth} />;
	});
};
