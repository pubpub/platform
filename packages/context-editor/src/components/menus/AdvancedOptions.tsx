import React, { useState } from "react";

import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { ChevronDown, ChevronUp } from "ui/icon";

import { MenuInputField } from "./MenuFields";

export const AdvancedOptions = () => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">Advanced Options</h3>
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="w-9 p-0"
						data-testid="advanced-options-trigger"
					>
						{isOpen ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
						<span className="sr-only">Toggle</span>
					</Button>
				</CollapsibleTrigger>
			</div>
			<CollapsibleContent className="space-y-2">
				<MenuInputField name="id" />
				<MenuInputField name="class" />
			</CollapsibleContent>
		</Collapsible>
	);
};
