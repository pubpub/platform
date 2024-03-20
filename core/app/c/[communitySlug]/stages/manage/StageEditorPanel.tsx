import { Suspense } from "react";
import { StageEditorPanelSheet } from "./StageEditorPanelSheet";
import { StageEditorPanelSheetContent } from "./StageEditorPanelSheetContent";
import { redirect } from "next/navigation";
import { editStage } from "./actions";

type Props = {
	communitySlug: string;
	editingStageId: string | undefined;
};

export const StageEditorPanel = (props: Props) => {
	const open = Boolean(props.editingStageId);
	const onOpenChange = async (open: boolean) => {
		"use server";
		if (!open) {
			await editStage(props.communitySlug);
		}
	};
	return (
		<StageEditorPanelSheet open={open} onOpenChange={onOpenChange}>
			<Suspense fallback={<div>Loading...</div>}>
				<StageEditorPanelSheetContent editingStageId={props.editingStageId} />
			</Suspense>
		</StageEditorPanelSheet>
	);
};
