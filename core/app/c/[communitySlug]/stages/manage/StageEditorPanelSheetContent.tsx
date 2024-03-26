import prisma from "~/prisma/db";

type Props = {
	editingStageId: string | undefined;
};

export const StageEditorPanelSheetContent = async (props: Props) => {
	if (props.editingStageId === undefined) {
		return <p>Byeee</p>;
	}
	const stage = props.editingStageId
		? await prisma.stage.findUnique({
				where: { id: props.editingStageId },
		  })
		: null;

	return <div>Stage: {stage?.name}</div>;
};
