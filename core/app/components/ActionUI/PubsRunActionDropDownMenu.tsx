import "server-only";

import type { ActionInstances, PubsId, Stages } from "db/public";
import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu";
import { ChevronDown, Play } from "ui/icon";

import { ActionRunFormWrapper } from "./ActionRunFormWrapper";

export type PageContext = {
	params: Record<string, unknown>;
	searchParams: Record<string, unknown>;
};

export const PubsRunActionDropDownMenu = async ({
	actionInstances,
	pubId,
	stage,
	pageContext,
	testId,
}: {
	actionInstances: ActionInstances[];
	pubId: PubsId;
	stage: Stages;
	pageContext: PageContext;
	testId?: string;
}) => {
	if (!actionInstances.length) {
		return null;
	}

	return (
		<DropdownMenu modal={true}>
			<DropdownMenuTrigger asChild>
				<Button
					className="flex items-center gap-x-2"
					variant="outline"
					size="sm"
					data-testid={testId}
				>
					<Play size="12" />
					Run action
					<ChevronDown size="14" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{actionInstances.map((actionInstance) => (
					<ActionRunFormWrapper
						stage={stage}
						pubId={pubId}
						actionInstance={actionInstance}
						pageContext={pageContext}
						key={actionInstance.id}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
