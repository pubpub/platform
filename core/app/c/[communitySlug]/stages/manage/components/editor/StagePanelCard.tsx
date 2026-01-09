import { CardHeader } from "ui/card"

export const StagePanelCardHeader = (props: React.ComponentProps<typeof CardHeader>) => {
	return (
		<CardHeader className="flex h-8 flex-wrap items-center justify-between">
			{props.children}
		</CardHeader>
	)
}
