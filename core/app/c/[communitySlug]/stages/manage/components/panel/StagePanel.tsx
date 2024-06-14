import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import type { PageContext } from "~/app/components/ActionUI/PubsRunActionDropDownMenu";
import { getStage } from "~/lib/queries/pub";
import { StagePanelActions } from "./StagePanelActions";
import { StagePanelMembers } from "./StagePanelMembers";
import { StagePanelOverview } from "./StagePanelOverview";
import { StagePanelPubs } from "./StagePanelPubs";
import { StagePanelRules } from "./StagePanelRules";
import { StagePanelSheet } from "./StagePanelSheet";

type Props = {
	stageId: string | undefined;
	pageContext: PageContext;
};

export const StagePanel = async (props: Props) => {
	let open = Boolean(props.stageId);

	if (props.stageId) {
		const stage = await getStage(props.stageId);
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
					<StagePanelOverview stageId={props.stageId} />
				</TabsContent>
				<TabsContent value="pubs">
					<StagePanelPubs stageId={props.stageId} pageContext={props.pageContext} />
				</TabsContent>
				<TabsContent value="actions" className="space-y-2">
					<StagePanelActions stageId={props.stageId} pageContext={props.pageContext} />
					<StagePanelRules stageId={props.stageId} />
				</TabsContent>
				<TabsContent value="members">
					<StagePanelMembers stageId={props.stageId} />
				</TabsContent>
			</Tabs>
		</StagePanelSheet>
	);
};
