import prisma from "~/prisma/db";

type Props = {
	editingStageId: string | undefined;
};

export const StageEditorPanelSheetContent = async (props: Props) => {
	const stage = props.editingStageId
		? await prisma.stage.findUnique({
				where: { id: props.editingStageId },
		  })
		: null;

	return <div>{stage?.name}</div>;
};
