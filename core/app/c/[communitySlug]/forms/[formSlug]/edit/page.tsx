import { notFound } from "next/navigation";

import { CommunitiesId } from "db/public";
import { ClipboardPenLine } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";

import { FormBuilder } from "~/app/components/FormBuilder/FormBuilder";
import { SaveFormButton } from "~/app/components/FormBuilder/SaveFormButton";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { autoCache } from "~/lib/server/cache/autoCache";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
import { getPubFields } from "~/lib/server/pubFields";
import { ContentLayout } from "../../../ContentLayout";

const getCommunityStages = (communityId: CommunitiesId) =>
	autoCache(db.selectFrom("stages").where("stages.communityId", "=", communityId).selectAll());

export default async function Page({ params: { formSlug, communitySlug } }) {
	const loginData = await getLoginData();
	const community = await findCommunityBySlug();

	if (!community) {
		notFound();
	}

	const communityStages = await getCommunityStages(community.id).execute();

	if (!loginData) {
		return null;
	}

	if (!isCommunityAdmin(loginData, { slug: communitySlug })) {
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
				<FormBuilder pubForm={form} id={formBuilderId} stages={communityStages} />
			</PubFieldProvider>
		</ContentLayout>
	);
}
