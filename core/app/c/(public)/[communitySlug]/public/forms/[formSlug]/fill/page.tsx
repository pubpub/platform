import { redirect, RedirectType } from "next/navigation";

import { getLoginData } from "~/lib/auth/loginData";
import { getCommunityRole } from "~/lib/auth/roles";
import { getForm } from "~/lib/server/form";
import { FormElement } from "./FormElement";

export default async function FormPage({
	params,
	searchParams,
}: {
	params: { formSlug: string; communitySlug: string };
	searchParams: { email?: string };
}) {
	const form = await getForm({ slug: params.formSlug }).executeTakeFirst();

	if (!form) {
		return <div>No form found</div>;
	}

	const loginData = await getLoginData();

	// this is most likely what happens if a user clicks a link in an email
	// with an expired token, or a token that has been used already
	if (!loginData) {
		redirect(
			`/c/${params.communitySlug}/public/forms/${params.formSlug}/expired?email=${searchParams.email}`,
			RedirectType.replace
		);
	}

	const role = getCommunityRole(loginData, { slug: params.communitySlug });
	if (!role) {
		return null;
	}

	return (
		<div className="container mx-auto flex w-full flex-col items-center">
			<h1>Form Page {form.name}</h1>
			<p>Hello {loginData.firstName}!</p>
			{form.elements.map((e) => {
				return <FormElement key={e.elementId} element={e} />;
			})}
			<p>Fill in the form below!</p>
		</div>
	);
}
