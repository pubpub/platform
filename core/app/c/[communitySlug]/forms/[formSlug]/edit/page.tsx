import { notFound, redirect } from "next/navigation";

import type { CommunitiesId } from "db/public";
import { Capabilities, MembershipType } from "db/public";
import { ClipboardPenLine, Info } from "ui/icon";
import { PubFieldProvider } from "ui/pubFields";
import { PubTypeProvider } from "ui/pubTypes";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { FormBuilder } from "~/app/components/FormBuilder/FormBuilder";
import { SaveFormButton } from "~/app/components/FormBuilder/SaveFormButton";
import { db } from "~/kysely/database";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { getPubTypesForCommunity } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { getForm } from "~/lib/server/form";
import { getPubFields } from "~/lib/server/pubFields";
import { ContentLayout } from "../../../ContentLayout";
import { EditFormTitleButton } from "./EditFormTitleButton";
import { FormCopyButton } from "./FormCopyButton";

const getCommunityStages = (communityId: CommunitiesId) =>
	db.selectFrom("stages").where("stages.communityId", "=", communityId).selectAll();

export default async function Page(props: {
	params: Promise<{
		formSlug: string;
		communitySlug: string;
	}>;
}) {
	const params = await props.params;

	const { formSlug, communitySlug } = params;

	const { user } = await getPageLoginData();
	const community = await findCommunityBySlug();

	if (!community) {
		notFound();
	}

	if (
		!(await userCan(
			Capabilities.editCommunity,
			{ type: MembershipType.community, communityId: community.id },
			user.id
		))
	) {
		redirect(`/c/${communitySlug}/unauthorized`);
	}

	const communityId = community.id as CommunitiesId;
	const communityStages = await getCommunityStages(communityId).execute();

	const [form, { fields }, pubTypes] = await Promise.all([
		getForm({
			slug: formSlug,
			communityId,
		}).executeTakeFirstOrThrow(),
		getPubFields({ communityId }).executeTakeFirstOrThrow(),
		getPubTypesForCommunity(community.id),
	]);

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
						{form.name}
						<EditFormTitleButton formId={form.id} name={form.name} />
					</div>
					{form.isDefault && (
						<div className="flex gap-1 text-sm font-normal">
							Default editor for this type
							<Tooltip>
								<TooltipTrigger>
									<Info size="16" />
								</TooltipTrigger>
								<TooltipContent>
									This form is used as the default internal editor for all Pubs of
									this type.
								</TooltipContent>
							</Tooltip>
						</div>
					)}
				</div>
			}
			right={
				<div className="flex items-center gap-2">
					<FormCopyButton formSlug={formSlug} />
					{/* <ArchiveFormButton id={form.id} className="border border-gray-950 px-4" />{" "} */}
					<SaveFormButton form={formBuilderId} />
				</div>
			}
		>
			<PubFieldProvider pubFields={fields}>
				{/* For the future PubType selector in RelationBlocks, implementation deferred */}
				<PubTypeProvider pubTypes={pubTypes}>
					<FormBuilder pubForm={form} id={formBuilderId} stages={communityStages} />
				</PubTypeProvider>
			</PubFieldProvider>
		</ContentLayout>
	);
}
