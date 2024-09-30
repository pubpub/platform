import type { Metadata } from "next";

import { notFound } from "next/navigation";

import type { UsersId } from "db/public";
import { AuthTokenType } from "db/public";

import { getPageLoginData } from "~/lib/auth/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { createToken } from "~/lib/server/token";
import { StageList } from "./components/StageList";

export const metadata: Metadata = {
	title: "Workflows",
};

type Props = { params: { communitySlug: string }; searchParams: Record<string, unknown> };

export default async function Page({ params, searchParams }: Props) {
	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(params.communitySlug),
	]);

	if (!community) {
		notFound();
	}

	const token = createToken({
		userId: user.id as UsersId,
		type: AuthTokenType.generic,
	});

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Stages</h1>
			</div>
			<StageList
				token={token}
				communityId={community.id}
				pageContext={{
					params,
					searchParams,
				}}
			/>
		</>
	);
}
