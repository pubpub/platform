import { getLoginData } from "~/lib/auth/loginData";
import { getForm } from "~/lib/server/form";
import { FormBuilder } from "./FormBuilder";

export default async function Page({ params: { formSlug } }) {
	const loginData = await getLoginData();

	if (!loginData) {
		return null;
	}
	if (!loginData.isSuperAdmin) {
		return null;
	}

	const form = await getForm({ slug: formSlug }).executeTakeFirstOrThrow();
	return <FormBuilder form={form} />;
}
