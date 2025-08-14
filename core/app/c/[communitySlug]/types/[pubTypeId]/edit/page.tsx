import { notFound, redirect } from "next/navigation";

import type { PubTypesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { ClipboardPenLine } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";

import { SaveFormButton } from "~/app/components/FormBuilder/SaveFormButton";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getPubType, getPubTypesForCommunity } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { redirectToLogin } from "~/lib/server/navigation/redirects";
import { getPubFields } from "~/lib/server/pubFields";
import { ContentLayout } from "../../../ContentLayout";

export default async function Page(props: {
	params: Promise<{
		pubTypeId: PubTypesId;
		communitySlug: string;
	}>;
}) {
	const params = await props.params;

	const { pubTypeId, communitySlug } = params;
	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(communitySlug),
	]);

	if (!community) {
		notFound();
	}

	if (!user) {
		redirectToLogin();
	}

	const [canEditPubType, pubType, { fields }, pubTypes] = await Promise.all([
		await userCan(
			Capabilities.editPubType,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		),

		getPubType(pubTypeId).executeTakeFirstOrThrow(),
		getPubFields({ communityId: community.id }).executeTakeFirstOrThrow(),
		getPubTypesForCommunity(community.id, { limit: 0 }),
	]);

	if (!canEditPubType) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	const formBuilderId = "formbuilderform";

	return (
		<ContentLayout
			title={
				<div className="flex flex-col">
					<div className="flex flex-row items-center">
						<ClipboardPenLine
							size={24}
							strokeWidth={1}
							className="mr-2 text-gray-500"
						/>{" "}
						{pubType.name}
						{/* <EditFormTitleButton formId={form.id} name={form.name} /> */}
					</div>
				</div>
			}
			right={
				<div className="flex items-center gap-2">
					{/* <FormCopyButton formSlug={formSlug} /> */}
					{/* <ArchiveFormButton id={form.id} className="border border-gray-950 px-4" />{" "} */}
					<SaveFormButton form={formBuilderId} />
				</div>
			}
		>
			<PubFieldProvider pubFields={fields}>
				<div></div>
				{/* <PubTypeProvider pubTypes={pubTypes}> */}
				{/* <FormBuilder pubForm={form} id={formBuilderId} stages={communityStages} /> */}
				{/* </PubTypeProvider> */}
			</PubFieldProvider>
		</ContentLayout>
	);
}
