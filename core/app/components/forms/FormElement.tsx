import type { GetPubResponseBody } from "contracts";
import type { MembersId, PubsId } from "db/public";
import { CoreSchemaType, ElementType } from "db/public";
import { expect } from "utils";

import type { Form } from "~/lib/server/form";
import { BooleanElement } from "./elements/BooleanElement";
import { Vector3Element } from "./elements/ConfidenceElement";
import { DateElement } from "./elements/DateElement";
import { FileUploadElement } from "./elements/FIleUploadElement";
import { TextElement } from "./elements/TextElement";
import { UserIdSelect } from "./elements/UserSelectElement";
import { FormElementToggle } from "./FormElementToggle";

export type FormElementProps = {
	pubId: PubsId;
	element: Form["elements"][number];
	searchParams: Record<string, unknown>;
	communitySlug: string;
	values: GetPubResponseBody["values"];
};

/**
 * Renders every CoreSchemaType EXCEPT MemberId!
 */
export const FormElement = ({
	pubId,
	element,
	searchParams,
	communitySlug,
	values,
}: FormElementProps) => {
	const { schemaName, label: labelProp, slug } = element;
	if (!slug) {
		if (element.type === ElementType.structural) {
			return (
				<div
					className="prose"
					// TODO: sanitize content
					dangerouslySetInnerHTML={{ __html: expect(element.content) }}
				/>
			);
		}
		return null;
	}

	if (!schemaName) {
		return null;
	}

	const elementProps = { label: labelProp ?? "", name: slug };

	let input: JSX.Element | undefined;

	if (
		schemaName === CoreSchemaType.String ||
		schemaName === CoreSchemaType.Email ||
		schemaName === CoreSchemaType.URL
	) {
		input = <TextElement {...elementProps} />;
	} else if (schemaName === CoreSchemaType.Boolean) {
		input = <BooleanElement {...elementProps} />;
	} else if (schemaName === CoreSchemaType.FileUpload) {
		input = <FileUploadElement pubId={pubId} {...elementProps} />;
	} else if (schemaName === CoreSchemaType.Vector3) {
		input = <Vector3Element {...elementProps} />;
	} else if (schemaName === CoreSchemaType.DateTime) {
		input = <DateElement {...elementProps} />;
	} else if (schemaName === CoreSchemaType.MemberId) {
		const userId = values[element.slug!] as MembersId | undefined;
		input = (
			<UserIdSelect
				label={elementProps.label}
				name={elementProps.name}
				id={element.elementId}
				searchParams={searchParams}
				value={userId}
				communitySlug={communitySlug}
			/>
		);
	} else if (schemaName === CoreSchemaType.Number) {
		input = <TextElement {...elementProps} type="number" />;
	} else if (schemaName === CoreSchemaType.NumericArray) {
		// TODO: support NumericArray
		return null;
	} else if (schemaName === CoreSchemaType.StringArray) {
		// TODO: support StringArray
		return null;
	}

	if (input) {
		return <FormElementToggle {...elementProps}>{input}</FormElementToggle>;
	}

	throw new Error(`Invalid CoreSchemaType ${schemaName}`);
};
