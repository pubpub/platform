import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import { StagePanelPubsRunActionDropDownMenu } from "../c/[communitySlug]/stages/manage/components/panel/StagePanelPubsRunActionDropDownMenu";
import { PubDropDown } from "./PubCRUD/PubDropDown";
import { getStageActions, getStagePubs } from "../c/[communitySlug]/stages/manage/components/panel/queries";
import { PubTitle } from "./PubTitle";

export const getActionsForStage = async (stageId: string) => {
	const stageActions = await getStageActions(stageId);

	return stageActions.map((action) => ({
		...action,
	}));
}

export const StageActions = async ( props: {stageId: StagesId}) => {
	const stagePubs = await getStagePubs(props.stageId);
	const actions = await getActionsForStage(props.stageId);
	return (
		<div>
			{stagePubs.map((pub) => (
            <div key={pub.id} className="flex items-center justify-between">
                <PubTitle pub={pub} />
                <div className="flex items-center gap-x-2">
                    <StagePanelPubsRunActionDropDownMenu
                        actionInstances={actions}
                        pub={pub}
                    />
                    <PubDropDown pubId={pub.id as PubsId} />
                </div>
            </div>
			))}
		</div>
	);

}
