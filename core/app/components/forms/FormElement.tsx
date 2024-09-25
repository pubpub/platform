import Markdown from "react-markdown";

import type { GetPubResponseBody } from "contracts";
import type { MembersId, PubsId } from "db/public";
import { CoreSchemaType, ElementType } from "db/public";

import type { Form } from "~/lib/server/form";
import { BooleanElement } from "./elements/BooleanElement";
import { Vector3Element } from "./elements/ConfidenceElement";
import { DateElement } from "./elements/DateElement";
import { FileUploadElement } from "./elements/FIleUploadElement";
import { TextElement } from "./elements/TextElement";
import { UserIdSelect } from "./elements/UserSelectElement";

export type FormElementProps = {
	pubId?: PubsId;
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
			return <Markdown>{element.content}</Markdown>;
		}
		return null;
	}

	if (!schemaName) {
		return null;
	}

	const elementProps = { label: labelProp ?? "", name: slug };
	if (
		schemaName === CoreSchemaType.String ||
		schemaName === CoreSchemaType.Email ||
		schemaName === CoreSchemaType.URL
	) {
		return <TextElement {...elementProps} />;
	}
	if (schemaName === CoreSchemaType.Boolean) {
		return <BooleanElement {...elementProps} />;
	}
	if (schemaName === CoreSchemaType.FileUpload && pubId) {
		return <FileUploadElement pubId={pubId} {...elementProps} />;
	}
	if (schemaName === CoreSchemaType.Vector3) {
		return <Vector3Element {...elementProps} />;
	}
	if (schemaName === CoreSchemaType.DateTime) {
		return <DateElement {...elementProps} />;
	}
	if (schemaName === CoreSchemaType.MemberId) {
		const userId = values[element.slug!] as MembersId | undefined;
		return (
			<UserIdSelect
				label={elementProps.label}
				name={elementProps.name}
				id={element.elementId}
				searchParams={searchParams}
				value={userId}
				communitySlug={communitySlug}
			/>
		);
	}

	throw new Error(`Invalid CoreSchemaType ${schemaName}`);
};
