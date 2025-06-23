import type { Metadata } from "next";

import { Suspense } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import type { CommunitiesId } from "db/public";
import { Button } from "ui/button";

import { FooterPagination } from "~/app/components/Pagination";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton";
import { getPageLoginData } from "~/lib/authentication/loginData";
import { env } from "~/lib/env/env";
import { findCommunityBySlug } from "~/lib/server/community";
import { ContentLayout } from "../ContentLayout";
import PubHeader from "./PubHeader";
import { PaginatedPubList } from "./PubList";

export const metadata: Metadata = {
	title: "Pubs",
};

type Props = {
	params: Promise<{ communitySlug: string }>;
	searchParams: { [key: string]: string | string[] | undefined };
};

export default async function Page(props: Props) {
	const searchParams = await props.searchParams;
	const params = await props.params;

	const [{ user }, community] = await Promise.all([
		getPageLoginData(),
		findCommunityBySlug(params.communitySlug),
	]);

	if (!community) {
		return null;
	}

	const basePath = `/c/${community.slug}/pubs`;

	return (
		<ContentLayout
			title={
				<>
					<BookOpen size={24} strokeWidth={1} className="mr-2 text-gray-500" /> Pubs
				</>
			}
			right={
				<div className="flex items-center gap-x-2">
					<Button variant="ghost" size="sm" asChild>
						<Link href="types">Manage Types</Link>
					</Button>
					<Suspense fallback={<SkeletonButton className="h-6 w-20" />}>
						<CreatePubButton
							communityId={community.id as CommunitiesId}
							className="bg-emerald-500 text-white"
						/>
					</Suspense>
				</div>
			}
			className="overflow-hidden"
		>
			<PaginatedPubList
				communityId={community.id}
				searchParams={searchParams}
				basePath={basePath}
				userId={user.id}
			/>
		</ContentLayout>
	);
}
