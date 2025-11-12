import "server-only";

import type { PubsId } from "db/public";
import type { ButtonProps } from "ui/button";
import { Button } from "ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu";
import { ChevronDown, Play } from "ui/icon";
import { cn } from "utils";

import type { ActionInstanceWithConfigDefaults } from "~/lib/types";
import { ActionRunForm } from "./ActionRunForm";

export type PubsRunActionDropDownMenuProps = {
	actionInstances: ActionInstanceWithConfigDefaults[];
	pubId: PubsId;
	testId?: string;
	/* accessible text for the button */
	buttonText?: string;
	iconOnly?: boolean;
	children?: React.ReactNode;
} & ButtonProps;

export const PubsRunActionDropDownMenu = async ({
	actionInstances,
	pubId,
	testId,
	iconOnly,
	buttonText,
	children,
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
					{children ?? (
						<>
							<Play size="12" strokeWidth="1px" className="text-neutral-500" />
							<span className={cn({ "sr-only": iconOnly })}>
								{buttonText ?? "Run action"}
							</span>
							{iconOnly ? null : <ChevronDown size="14" />}
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{actionInstances.map((actionInstance) => (
					<ActionRunForm
						key={actionInstance.id}
						defaultFields={actionInstance.defaultedActionConfigKeys ?? []}
						pubId={pubId}
						actionInstance={actionInstance}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
