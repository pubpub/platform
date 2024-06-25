import React from "react";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";

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
		.select([
			"forms.id",
			"forms.name",
		])
		.execute();
	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Forms</h1>
			</div>
			<div>
                This isnt even my final form
			</div>
            <div>
                {forms.map((form) => (
                    <div key={form.id}>
                        {form.name}
                    </div>
                ))}
            </div>
		</>
	);
}
