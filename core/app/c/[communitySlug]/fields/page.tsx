import { notFound } from "next/navigation";

import { FormInput } from "ui/icon";

import ContentLayout from "~/app/c/[communitySlug]/ContentLayout";
import { FieldsProvider } from "~/app/c/[communitySlug]/types/FieldsProvider";
import { getLoginData } from "~/lib/auth/loginData";
import { getFields } from "~/lib/server/fields";
import FieldsTable from "./FieldsTable";

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
				<div className="m-4">
					<FieldsTable fields={fields} />
				</div>
			</ContentLayout>
		</FieldsProvider>
	);
}
