import { notFound } from "next/navigation";

import { FormInput } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";

import { ContentLayout } from "~/app/c/[communitySlug]/ContentLayout";
import { getLoginData } from "~/lib/auth/loginData";
import { getPubFields } from "~/lib/server/pubFields";
import { FieldsTable } from "./FieldsTable";
import { NewFieldButton } from "./NewFieldButton";

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return notFound();
	}

	const pubFields = await getPubFields().executeTakeFirst();

	if (!pubFields || !pubFields.fields) {
		return null;
	}

	return (
		<PubFieldProvider pubFields={pubFields.fields}>
			<ContentLayout
				title={
					<>
						<FormInput size={24} strokeWidth={1} className="mr-2 text-slate-500" />{" "}
						Fields
					</>
				}
				headingAction={<NewFieldButton />}
			>
				<div className="m-4">
					<FieldsTable fields={pubFields.fields} />
				</div>
			</ContentLayout>
		</PubFieldProvider>
	);
}
