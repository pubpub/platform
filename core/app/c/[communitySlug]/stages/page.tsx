import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { StageList } from "./components/StageList";

export const metadata: Metadata = {
	title: "Workflows",
};

type Props = { params: Promise<{ communitySlug: string }>; searchParams: Record<string, unknown> };

export default async function Page(props: Props) {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(params.communitySlug),
	]);

    if (!community) {
		notFound();
	}

    return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Stages</h1>
				<CreatePubButton communityId={community.id} text="Add Pub" />
			</div>
			<StageList
				communityId={community.id}
				pageContext={{
					params,
					searchParams,
				}}
			/>
		</>
	);
}
