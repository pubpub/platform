import type { Metadata } from "next";

import Link from "next/link";
import { BookOpen } from "lucide-react";

import type { CommunitiesId } from "db/public";
import { Button } from "ui/button";

import { FooterPagination } from "~/app/components/Pagination";
import { CreatePubButton } from "~/app/components/pubs/CreatePubButton";
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
		// Position absolute to remove the parent layout padding so that the footer can hug the bottom properly
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
					<CreatePubButton
						communityId={community.id as CommunitiesId}
						className="bg-emerald-500 text-white"
					/>
				</div>
			}
		>
			{/* Restore layout padding, but give extra bottom padding so that last item is not covered by the footer */}
			<div className="">
				<PaginatedPubList
					communityId={community.id}
					searchParams={searchParams}
					basePath={basePath}
					userId={user.id}
				/>
			</div>
		</ContentLayout>
	);
}
