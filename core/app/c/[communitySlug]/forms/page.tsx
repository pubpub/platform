import React from "react";
import partition from "lodash.partition";

import { MemberRole } from "db/public";
import { ClipboardPenLine } from "ui/icon";

import { ActiveArchiveTabs } from "~/app/components/ActiveArchiveTabs";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin } from "~/lib/auth/roles";
import { autoCache } from "~/lib/server/cache/autoCache";
import { getAllPubTypesForCommunity } from "~/lib/server/pubtype";
import { ContentLayout } from "../ContentLayout";
import { FormTable } from "./FormTable";
import { NewFormButton } from "./NewFormButton";

export default async function Page({ params: { communitySlug } }) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	if (!isCommunityAdmin(loginData, { slug: communitySlug })) {
		return null;
	}

	const forms = await autoCache(
		db
			.selectFrom("forms")
			.innerJoin("pub_types", "pub_types.id", "forms.pubTypeId")
			.innerJoin("communities", "communities.id", "pub_types.communityId")
			.select([
				"forms.id as id",
				"forms.slug as slug",
				"forms.name as formName",
				"pub_types.name as pubType",
				"pub_types.updatedAt", // TODO: this should be the form's updatedAt
				"forms.isArchived",
				"forms.slug",
			])
			.where("communities.slug", "=", communitySlug)
	).execute();

	const [active, archived] = partition(forms, (form) => !form.isArchived);

	const tableForms = (formList: typeof forms) =>
		formList.map((form) => {
			const { id, formName, pubType, updatedAt, isArchived, slug } = form;
			return {
				id,
				slug,
				formName,
				pubType,
				updated: new Date(updatedAt),
				isArchived,
			};
		});

	const pubTypes = await getAllPubTypesForCommunity().execute();

	return (
		<ContentLayout
			title={
				<>
					<ClipboardPenLine size={24} strokeWidth={1} className="mr-2 text-slate-500" />{" "}
					Forms
				</>
			}
			headingAction={<NewFormButton pubTypes={pubTypes} />}
		>
			{forms.length === 0 ? (
				<div className="flex h-full items-center justify-center">
					<div className="flex max-w-[444px] flex-col items-center justify-center">
						<h2 className="mb-2 text-2xl font-semibold text-gray-800">
							You don’t have any forms yet
						</h2>
						<p className="mb-6 text-center text-gray-600">
							Forms are templates of questions used to collect information from users
							via a response submission process.
						</p>
						<NewFormButton pubTypes={pubTypes} />
					</div>
				</div>
			) : archived.length > 0 ? (
				<ActiveArchiveTabs
					activeContent={<FormTable forms={tableForms(active)} />}
					archiveContent={<FormTable forms={tableForms(archived)} />}
					className="m-4"
				/>
			) : (
				<div className="m-4">
					<FormTable forms={tableForms(active)} />
				</div>
			)}
		</ContentLayout>
	);
}
