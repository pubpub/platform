import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { StagePanelActions } from "./StagePanelActions";
import { StagePanelOverview } from "./StagePanelOverview";
import { StagePanelSheet } from "./StagePanelSheet";
import { StagePanelPubs } from "./StagePanelPubs";
import { StagePanelMembers } from "./StagePanelMembers";
import { getStage } from "./queries";

type Props = {
	stageId: string | undefined;
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
					<StagePanelPubs stageId={props.stageId} />
				</TabsContent>
				<TabsContent value="actions">
					<StagePanelActions stageId={props.stageId} />
				</TabsContent>
				<TabsContent value="members">
					<StagePanelMembers stageId={props.stageId} />
				</TabsContent>
			</Tabs>
		</StagePanelSheet>
	);
};
