import { defaultComponent } from "schemas";

import type { GetPubResponseBody } from "contracts";
import type { MembersId, PubsId } from "db/public";
import { CoreSchemaType, InputComponent } from "db/public";

import type { Form as PubPubForm } from "~/lib/server/form";
import { FormElement } from "~/app/components/FormSchemaRendering/FormElement";
import { UserSelectServer } from "~/app/components/UserSelect/UserSelectServer";
import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";

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

export const InnerForm = async ({
	pub,
	elements,
	searchParams,
	values,
	communitySlug,
}: {
	pub: GetPubResponseBody;
	elements: PubPubForm["elements"];
	searchParams: Record<string, unknown>;
	values: GetPubResponseBody["values"];
	communitySlug: string;
}) => {
	return (
		<>
			{elements.map((e) => {
				const component = e.component ?? (e.schemaName && defaultComponent(e.schemaName));
				if (component === InputComponent.memberSelect) {
					const userId = values[e.slug!] as MembersId | undefined;
					return (
						<UserIdSelect
							key={e.elementId}
							label={e.label ?? ""}
							name={e.slug ?? ""}
							id={e.elementId}
							searchParams={searchParams}
							value={userId}
							communitySlug={communitySlug}
						/>
					);
				}
				return (
					<FormElement
						key={e.elementId}
						pubId={pubId}
						element={e}
						searchParams={searchParams}
						communitySlug={communitySlug}
						values={values}
					/>
				);
			})}
		</>
	);
};
