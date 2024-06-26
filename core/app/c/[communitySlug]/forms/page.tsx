import React from "react";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogTrigger } from "ui/dialog";
import { ClipboardPenLine, ListPlus } from "ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/tooltip";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { FormTable } from "./FormTable";

export default async function Page() {
	const loginData = await getLoginData();
	// const [open, setOpen] = React.useState(false);

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

	function NoFormsState() {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
				<h2 className="mb-2 text-2xl font-semibold text-gray-800">
					You don’t have any forms yet
				</h2>
				<p className="mb-6 text-center text-gray-600">
					Forms are templates of questions used to collect information from users via a
					response submission process.
				</p>
				<StoopidButton />
			</div>
		);
	}
		
	function StoopidButton() {
		return (
			<Dialog>
				<TooltipProvider>
					<DialogTrigger asChild>
						<Button className="rounded bg-green-500 px-4 py-2 text-white shadow hover:bg-green-600">
							<ListPlus size="16" /> New Form
						</Button>
					</DialogTrigger>
				</TooltipProvider>
				<DialogContent>
					imma potato
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<div className="min-h-screen p-8">
			<div className="mx-auto max-w-7xl rounded-lg bg-white shadow-md">
				<header className="flex items-center justify-between border-b p-4">
					<h1 className="text-lg font-semibold">
						<div className="flex flex-row items-center">
							<ClipboardPenLine size={14} className="mr-2" /> Forms
						</div>
					</h1>
					<StoopidButton />
				</header>
				<div className="p-4">
					{forms.length === 0 ? (
						<NoFormsState />
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
