import type { GetPubResponseBody } from "contracts";
import type { PubsId, UsersId } from "db/public";
import { CoreSchemaType } from "db/public";

import type { Form as PubPubForm } from "~/lib/server/form";
import { UserSelectServer } from "~/app/components/UserSelect/UserSelectServer";
import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { FormElement } from "./FormElement";

const UserIdSelect = async ({
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
	value?: UsersId;
	searchParams: Record<string, unknown>;
	communitySlug: string;
}) => {
	const community = await autoCache(
		db.selectFrom("communities").selectAll().where("slug", "=", communitySlug)
	).executeTakeFirstOrThrow();
	const queryParamName = `user-${id}`;
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

export const InnerForm = ({
	pubId,
	elements,
	searchParams,
	values,
	communitySlug,
}: {
	pubId: PubsId;
	elements: PubPubForm["elements"];
	searchParams: Record<string, unknown>;
	values: GetPubResponseBody["values"];
	communitySlug: string;
}) => {
	return (
		<>
			{elements.map((e) => {
				const userId =
					e.schemaName === CoreSchemaType.UserId && e.slug ? values[e.slug] : undefined;
				return (
					<FormElement
						pubId={pubId}
						key={e.elementId}
						element={e}
						userSelect={
							<UserIdSelect
								label={e.label ?? ""}
								name={e.slug ?? ""}
								id={e.elementId}
								searchParams={searchParams}
								value={userId as UsersId | undefined}
								communitySlug={communitySlug}
							/>
						}
					/>
				);
			})}
		</>
	);
};
