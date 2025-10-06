import type { User } from "lucia";

import Link from "next/link";

import type { StagesId } from "db/public";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import { getStage } from "~/lib/db/queries";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { capitalize } from "~/lib/string";
import { StagePanelActions } from "./actionsTab/StagePanelActions";
import { StagePanelRules } from "./actionsTab/StagePanelRules";
import { StagePanelMembers } from "./StagePanelMembers";
import { StagePanelOverview } from "./StagePanelOverview";
import { StagePanelPubs } from "./StagePanelPubs";
import { StagePanelSheet } from "./StagePanelSheet";

type Props = {
	stageId: StagesId | undefined;
	searchParams: Record<string, string>;
	user: User;
};

export const StagePanel = async (props: Props) => {
	const communitySlug = await getCommunitySlug();
	let open = Boolean(props.stageId);

	if (!props.stageId) {
		return null;
	}

	if (props.stageId) {
		const stage = await getStage(props.stageId, props.user.id).executeTakeFirst();
		if (stage === null) {
			open = false;
		}
	}

	const defaultTab = props.searchParams.tab || "overview";

	return (
		<StagePanelSheet open={open}>
			<Tabs defaultValue={defaultTab}>
				<TabsList className="grid grid-cols-4">
					<TabLink
						tab="overview"
						communitySlug={communitySlug}
						searchParams={props.searchParams}
					/>
					<TabLink
						tab="pubs"
						communitySlug={communitySlug}
						searchParams={props.searchParams}
					/>
					<TabLink
						tab="actions"
						communitySlug={communitySlug}
						searchParams={props.searchParams}
					/>
					<TabLink
						tab="members"
						communitySlug={communitySlug}
						searchParams={props.searchParams}
					/>
				</TabsList>
				<TabsContent value="overview">
					<StagePanelOverview stageId={props.stageId} userId={props.user.id} />
				</TabsContent>
				<TabsContent value="pubs">
					<StagePanelPubs
						stageId={props.stageId as StagesId}
						searchParams={props.searchParams}
						userId={props.user.id}
					/>
				</TabsContent>
				<TabsContent value="actions" className="space-y-2">
					<StagePanelActions stageId={props.stageId} userId={props.user.id} />
					<StagePanelRules stageId={props.stageId} userId={props.user.id} />
				</TabsContent>
				<TabsContent value="members">
					<StagePanelMembers stageId={props.stageId} user={props.user} />
				</TabsContent>
			</Tabs>
		</StagePanelSheet>
	);
};

function TabLink({
	tab,
	communitySlug,
	searchParams,
}: {
	tab: string;
	communitySlug: string;
	searchParams: Record<string, string>;
}) {
	const sparams = new URLSearchParams(searchParams);
	sparams.set("tab", tab);

	return (
		<TabsTrigger value={tab} asChild>
			<Link href={`/c/${communitySlug}/stages/manage?${sparams.toString()}`}>
				{capitalize(tab)}
			</Link>
		</TabsTrigger>
	);
}
