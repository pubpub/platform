import { Suspense } from "react";
import { StageEditorPanelSheet } from "./StageEditorPanelSheet";
import { StageEditorPanelSheetContent } from "./StageEditorPanelSheetContent";

type Props = {
	communitySlug: string;
	editingStageId: string | undefined;
};

export const StageEditorPanel = (props: Props) => {
	const open = Boolean(props.editingStageId);
	return (
		<StageEditorPanelSheet open={open} editingStageId={props.editingStageId}>
			<Suspense fallback={<div>Loading...</div>}>
				<StageEditorPanelSheetContent editingStageId={props.editingStageId} />
			</Suspense>
		</StageEditorPanelSheet>
	);
};
