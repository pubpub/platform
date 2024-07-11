import { getLoginData } from "~/lib/auth/loginData";
import { getFormBySlug } from "~/lib/server/form";
import { FormBuilder } from "./FormBuilder";

export default async function Page({ params: { formSlug } }) {
	const loginData = await getLoginData();

	if (!loginData) {
		return null;
	}
	if (!loginData.isSuperAdmin) {
		return null;
	}

	const form = await getFormBySlug(formSlug).executeTakeFirstOrThrow();
	return <FormBuilder form={form} />;
}
