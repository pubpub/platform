import { CardHeader } from "ui/card";

export const StagePanelCardHeader = (
	props: React.ComponentProps<typeof CardHeader>,
) => {
	return (
		<CardHeader className="flex flex-wrap items-center justify-between h-8">
			{props.children}
		</CardHeader>
	);
};
