import type { Metadata } from "next";

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { FlagTriangleRightIcon } from "ui/icon";

import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { ContentLayout } from "../ContentLayout";
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
		<ContentLayout
			title={
				<>
					<FlagTriangleRightIcon
						size={20}
						strokeWidth={1}
						className="mr-2 text-gray-500"
					/>
					<span>Stages</span>
				</>
			}
			right={
				<Suspense fallback={<SkeletonButton className="h-8 w-24" />}>
					<CreatePubButton
						communityId={community.id}
						text="Add Pub"
						className="bg-emerald-500 text-white"
					/>
				</Suspense>
			}
		>
			<div className="px-4 py-8">
				<StageList
					userId={user.id}
					communityId={community.id}
					searchParams={searchParams}
				/>
			</div>
		</ContentLayout>
	);
}
