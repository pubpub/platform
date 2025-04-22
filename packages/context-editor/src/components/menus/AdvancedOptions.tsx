import type { Mark } from "prosemirror-model";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ChevronDown, ChevronUp } from "ui/icon";
import { Input } from "ui/input";

const Option = ({ name, defaultValue }: { name: string; defaultValue: string }) => {
	const form = useFormContext();
	return (
		<FormField
			name={name}
			control={form.control}
			render={({ field }) => {
				return (
					<FormItem className="flex flex-col">
						<div className="grid grid-cols-4 items-center">
							<FormLabel>{name}</FormLabel>
							<FormControl>
								<Input {...field} placeholder="None" className="col-span-3" />
							</FormControl>
						</div>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

export const AdvancedOptions = ({ mark }: { mark: Mark }) => {
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
				<Option name="id" defaultValue={mark.attrs?.id ?? ""} />
				<Option name="class" defaultValue={mark.attrs?.class ?? ""} />
			</CollapsibleContent>
		</Collapsible>
	);
};
