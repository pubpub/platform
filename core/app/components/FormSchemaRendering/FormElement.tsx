import Markdown from "react-markdown";

import type { GetPubResponseBody } from "contracts";
import type { MembersId, PubsId } from "db/public";
import { CoreSchemaType, ElementType } from "db/public";

import type { Form } from "~/lib/server/form";
import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
// import { findCommunityBySlug } from "~/lib/server/community";
import { UserSelectServer } from "../UserSelect/UserSelectServer";
import {
	BooleanElement,
	DateElement,
	FileUploadElement,
	TextElement,
	Vector3Element,
} from "./FormSchemaClientElements";

export const UserIdSelect = async ({
	label,
	name,
	id,
	value,
	searchParams,
	communitySlug,
}: {
	label: string;
	name: string;
	id: string;
	value?: MembersId;
	searchParams: Record<string, unknown>;
	communitySlug: string;
}) => {
	const community = await autoCache(
		db.selectFrom("communities").selectAll().where("slug", "=", communitySlug)
	).executeTakeFirstOrThrow();
	const queryParamName = `user-${id.split("-").pop()}`;
	const query = searchParams?.[queryParamName] as string | undefined;
	return (
		<UserSelectServer
			community={community}
			fieldLabel={label}
			fieldName={name}
			query={query}
			queryParamName={queryParamName}
			value={value}
		/>
	);
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
}: {
	pubId?: PubsId;
	element: Form["elements"][number];
	searchParams: Record<string, unknown>;
	communitySlug: string;
	values?: GetPubResponseBody["values"];
}) => {
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
		// TODO: figure out what kind of text element the user wanted (textarea vs input)
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
	if (schemaName === CoreSchemaType.MemberId && values) {
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
