import { notFound } from "next/navigation";

import type { CommunitiesId } from "db/public";
import { ClipboardPenLine } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";

import { FormBuilder } from "~/app/components/FormBuilder/FormBuilder";
import { SaveFormButton } from "~/app/components/FormBuilder/SaveFormButton";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
import { getPubFields } from "~/lib/server/pubFields";
import { ContentLayout } from "../../../ContentLayout";
import { EditFormTitleButton } from "./EditFormTitleButton";

const getCommunityStages = (communityId: CommunitiesId) =>
	db.selectFrom("stages").where("stages.communityId", "=", communityId).selectAll();

export default async function Page({
	params: { formSlug, communitySlug },
}: {
	params: {
		formSlug: string;
		communitySlug: string;
	};
}) {
	const { user } = await getPageLoginData();
	const community = await findCommunityBySlug();

	if (!community) {
		notFound();
	}

	const communityStages = await getCommunityStages(community.id).execute();

	if (!isCommunityAdmin(user, { slug: communitySlug })) {
		return null;
	}

	const communityId = community.id as CommunitiesId;

	const [form, { fields }] = await Promise.all([
		getForm({
			slug: formSlug,
			communityId,
		}).executeTakeFirstOrThrow(),
		getPubFields({ communityId }).executeTakeFirstOrThrow(),
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
			editFormTitleButton={
				<>
					<EditFormTitleButton name={form.name} communityId={communityId}/>
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
