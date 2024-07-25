import { ClipboardPenLine } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";

import { ArchiveFormButton } from "~/app/components/FormBuilder/ArchiveFormButton";
import { FormBuilder } from "~/app/components/FormBuilder/FormBuilder";
import { SaveFormButton } from "~/app/components/FormBuilder/SaveFormButton";
import { getLoginData } from "~/lib/auth/loginData";
import { getForm } from "~/lib/server/form";
import { getPubFields } from "~/lib/server/pubFields";
import { ContentLayout } from "../../../ContentLayout";

export default async function Page({ params: { formSlug } }) {
	const loginData = await getLoginData();

	if (!loginData) {
		return null;
	}
	if (!loginData.isSuperAdmin) {
		return null;
	}

	const [form, { fields }] = await Promise.all([
		getForm({ slug: formSlug }).executeTakeFirstOrThrow(),
		getPubFields().executeTakeFirstOrThrow(),
	]);

	const formBuilderId = "formbuilderform";

	return (
		<ContentLayout
			title={
				<>
					<ClipboardPenLine size={24} strokeWidth={1} className="mr-2 text-slate-500" />{" "}
					{form.name}
				</>
			}
			headingAction={
				<div className="flex gap-2">
					{/* <ArchiveFormButton id={form.id} className="border border-slate-950 px-4" />{" "} */}
					<SaveFormButton form={formBuilderId} />
				</div>
			}
		>
			<PubFieldProvider pubFields={fields}>
				<FormBuilder
					pubForm={form}
					id={formBuilderId}
					superadmin={loginData.isSuperAdmin}
				/>
			</PubFieldProvider>
		</ContentLayout>
	);
}
