import type { Metadata } from "next";

import { ContextEditorClient } from "~/app/components/ContextEditorClient";
import { getPageLoginData } from "~/lib/auth/loginData";

export const metadata: Metadata = {
	title: "Community Settings",
};

export default async function Page({ params }: { params: { communitySlug: string } }) {
	await getPageLoginData();
	const { communitySlug } = params;
	return (
		<main className="flex flex-col items-start gap-y-4">
			<h1 className="text-xl font-bold">Test</h1>
			<ContextEditorClient />
		</main>
	);
}
