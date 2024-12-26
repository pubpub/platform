import type { User } from "lucia";

import type { StagesId } from "db/public";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { getStage } from "~/lib/db/queries";
import { StagePanelActions } from "./actionsTab/StagePanelActions";
import { StagePanelRules } from "./actionsTab/StagePanelRules";
import { StagePanelMembers } from "./StagePanelMembers";
import { StagePanelOverview } from "./StagePanelOverview";
import { StagePanelPubs } from "./StagePanelPubs";
import { StagePanelSheet } from "./StagePanelSheet";

type Props = {
	stageId: StagesId | undefined;
	pageContext: PageContext;
	user: User;
};

export const StagePanel = async (props: Props) => {
	let open = Boolean(props.stageId);

	if (props.stageId) {
		const stage = await getStage(props.stageId, props.user.id).executeTakeFirst();
		if (stage === null) {
			open = false;
		}
	}

	return (
		<StagePanelSheet open={open}>
			<Tabs defaultValue="overview">
				<TabsList className="grid grid-cols-4">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="pubs">Pubs</TabsTrigger>
					<TabsTrigger value="actions">Actions</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
				</TabsList>
				<TabsContent value="overview">
					<StagePanelOverview stageId={props.stageId} userId={props.user.id} />
				</TabsContent>
				<TabsContent value="pubs">
					<StagePanelPubs
						stageId={props.stageId as StagesId}
						pageContext={props.pageContext}
						userId={props.user.id}
					/>
				</TabsContent>
				<TabsContent value="actions" className="space-y-2">
					<StagePanelActions
						stageId={props.stageId}
						pageContext={props.pageContext}
						userId={props.user.id}
					/>
					<StagePanelRules stageId={props.stageId} userId={props.user.id} />
				</TabsContent>
				<TabsContent value="members">
					<StagePanelMembers stageId={props.stageId} user={props.user} />
				</TabsContent>
			</Tabs>
		</StagePanelSheet>
	);
};
