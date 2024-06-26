import React from "react";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";
import { ClipboardPenLine, Plus } from "ui/icon";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import CreateFormForm from "./CreatFormForm";
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
		<div className="min-h-screen">
			<div className="mx-auto max-w-7xl rounded-lg bg-white shadow-md">
				<header className="flex items-center justify-between border-b p-4">
					<h1 className="text-lg font-semibold">
						<div className="flex flex-row items-center">
							<ClipboardPenLine size={14} className="mr-2" /> Forms
						</div>
					</h1>
				</header>
				<div className="p-4">
					{forms.length === 0 ? (
						<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
							<h2 className="mb-2 text-2xl font-semibold text-gray-800">
								You don’t have any forms yet
							</h2>
							<p className="mb-6 text-center text-gray-600">
								Forms are templates of questions used to collect information from
								users via a response submission process.
							</p>
						</div>
					) : (
						<div>
							<FormTable forms={tableForms} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
