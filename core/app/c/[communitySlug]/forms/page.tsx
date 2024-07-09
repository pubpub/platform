import React from "react";
import partition from "lodash.partition";

import { ClipboardPenLine } from "ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { getTypes } from "~/lib/server/pubtype";
import { FormTable } from "./FormTable";
import { NewFormButton } from "./NewFormButton";

export default async function Page({ params: { communitySlug } }) {
	const loginData = await getLoginData();

	if (!loginData) {
		return null;
	}
	if (!loginData.isSuperAdmin) {
		return null;
	}

	const forms = await db
		.selectFrom("forms")
		.innerJoin("pub_types", "pub_types.id", "forms.pubTypeId")
		.innerJoin("communities", "communities.id", "pub_types.communityId")
		.select([
			"forms.id as id",
			"forms.name as formName",
			"pub_types.name as pubType",
			"pub_types.updatedAt", // TODO: this should be the form's updatedAt
			"forms.isArchived",
		])
		.where("communities.slug", "=", communitySlug)
		.execute();

	const [active, archived] = partition(forms, (form) => !form.isArchived);

	const tableForms = (formList) =>
		formList.map((form) => {
			const { id, formName, pubType, updatedAt } = form;
			return {
				id,
				formName,
				pubType,
				updated: new Date(updatedAt),
			};
		});

	const pubTypes = await getTypes(communitySlug).execute();

	return (
		<div className="absolute inset-0 w-full">
			<div className="flex h-full flex-col">
				<header className="flex items-center justify-between border-b bg-gray-50 p-4 shadow-md">
					<h1 className="text-lg font-semibold">
						<div className="flex flex-row items-center">
							<ClipboardPenLine
								size={24}
								strokeWidth={1}
								className="mr-2 text-slate-500"
							/>{" "}
							Forms
						</div>
					</h1>
					<NewFormButton pubTypes={pubTypes} />
				</header>
				<div className="h-full flex-1 overflow-auto">
					{forms.length === 0 ? (
						<div className="flex h-full items-center justify-center">
							<div className="flex max-w-[444px] flex-col items-center justify-center">
								<h2 className="mb-2 text-2xl font-semibold text-gray-800">
									You don’t have any forms yet
								</h2>
								<p className="mb-6 text-center text-gray-600">
									Forms are templates of questions used to collect information
									from users via a response submission process.
								</p>
								<NewFormButton pubTypes={pubTypes} />
							</div>
						</div>
					) : archived.length > 0 ? (
						<Tabs defaultValue="active" className="">
							<TabsList>
								<TabsTrigger value="active">Active</TabsTrigger>
								<TabsTrigger value="archived">Archived</TabsTrigger>
							</TabsList>
							<TabsContent value="active">
								<FormTable forms={tableForms(active)} />
							</TabsContent>
							<TabsContent value="archived">
								<FormTable forms={tableForms(archived)} />
							</TabsContent>
						</Tabs>
					) : (
						<div>
							<FormTable forms={tableForms(active)} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
