import "server-only";

import type { ActionInstances, PubsId, Stages } from "db/public";
import type { ButtonProps } from "ui/button";
import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu";
import { ChevronDown, Play } from "ui/icon";
import { cn } from "utils";

import { ActionRunFormWrapper } from "~/app/components/ActionUI/ActionRunFormWrapper";

export type PubsRunActionDropDownMenuProps = {
	actionInstances: ActionInstances[];
	pubId: PubsId;
	stage: Stages;
	testId?: string;
	iconOnly?: boolean;
} & ButtonProps;

export const PubsRunActionDropDownMenu = async ({
	actionInstances,
	pubId,
	stage,
	testId,
	iconOnly,
	...buttonProps
}: PubsRunActionDropDownMenuProps) => {
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
					{...buttonProps}
				>
					<Play size="12" strokeWidth="1px" className="text-neutral-500" />
					<span className={cn({ "sr-only": iconOnly })}>Run action</span>
					{iconOnly ? null : <ChevronDown size="14" />}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{actionInstances.map((actionInstance) => (
					<ActionRunFormWrapper
						stage={stage}
						pubId={pubId}
						actionInstance={actionInstance}
						key={actionInstance.id}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
