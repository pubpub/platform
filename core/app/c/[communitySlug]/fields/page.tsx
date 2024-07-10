import { notFound } from "next/navigation";
import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { FormInput } from "ui/icon";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubField } from "~/lib/types";
import ContentLayout from "~/app/c/[communitySlug]/ContentLayout";
import { FieldsProvider } from "~/app/c/[communitySlug]/types/FieldsProvider";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { autoCache } from "~/lib/server/cache/autoCache";
import { getFields } from "~/lib/server/fields";

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return notFound();
	}

	const { fields } = await getFields();

	if (!fields) {
		return null;
	}
	return (
		<FieldsProvider fields={fields}>
			<ContentLayout
				heading={
					<>
						<FormInput size={24} strokeWidth={1} className="mr-2 text-slate-500" />{" "}
						Forms
					</>
				}
			>
				<div className="m-4">TODO: table</div>
			</ContentLayout>
		</FieldsProvider>
	);
}
