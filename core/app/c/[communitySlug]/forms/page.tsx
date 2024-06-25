import React from "react";
import { Button } from "ui/button";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
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

    
    function NoFormsState(){
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    You don’t have any forms yet
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                    Forms are templates of questions used to collect information from users
                    via a response submission process.
                </p>
                <Button className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600">
                    + New Form
                </Button>
            </div>
        );
    }


	return (
		<div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto bg-white shadow-md rounded-lg">
                <header className="flex justify-between items-center p-4 border-b">
                    <h1 className="text-lg font-semibold">Forms</h1>
                    <Button className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600">
                        + New Form
                    </Button>
                </header>
                <div className="p-4">
                    {forms.length === 0 ? (
                        <NoFormsState />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <FormTable forms={tableForms}/>
                        </div>
                    )}
                </div>
            </div>
        </div>
	);
}
