import React from "react";

import { ClipboardPenLine, Plus } from "ui/icon";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import ContentLayout from "../ContentLayout";
import { FormTable } from "./FormTable";

export default async function Page() {
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
		.select([
			"forms.id as id",
			"forms.name as formName",
			"pub_types.name as pubType",
			"updatedAt",
		])
		.execute();

	const tableForms = forms.map((form) => {
		const { id, formName, pubType, updatedAt } = form;
		return {
			id,
			formName,
			pubType,
			updated: new Date(updatedAt),
		};
	});

	return (
		<ContentLayout
			title={
				<>
					<ClipboardPenLine size={24} strokeWidth={1} className="mr-2 text-slate-500" />{" "}
					Forms
				</>
			}
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
					</div>
				</div>
			) : (
				<div className="p-4">
					<FormTable forms={tableForms} />
				</div>
			)}
		</ContentLayout>
	);
}
