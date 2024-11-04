import type { Metadata } from "next";

import Link from "next/link";

import { getPageLoginData } from "~/lib/auth/loginData";

export const metadata: Metadata = {
	title: "Community Settings",
};

export default async function Page({ params }: { params: { communitySlug: string } }) {
	await getPageLoginData();
	const { communitySlug } = params;
	return (
		<main className="flex flex-col items-start gap-y-4">
			<h1 className="text-xl font-bold">Community Settings</h1>
			<div className="prose">
				<ul>
					<li>
						<Link className="underline" href={`/c/${communitySlug}/settings/tokens`}>
							Tokens
						</Link>
					</li>
				</ul>
			</div>
		</main>
	);
}
