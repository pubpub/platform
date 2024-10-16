"use client";

import { useState } from "react";

import type { PubFieldsId } from "db/public";
import { Button } from "ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "ui/command";
import { ChevronsUpDown } from "ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { usePubFieldContext } from "ui/pubFields";

export type FieldSelectProps = {
	excludedFields: PubFieldsId[];
	onFieldSelect: (fieldId: PubFieldsId, name: string, slug: string) => void;
	modal?: boolean;
};

export function FieldSelect({ excludedFields, onFieldSelect, modal = false }: FieldSelectProps) {
	const [open, setOpen] = useState(false);

	const fields = usePubFieldContext();
	const availableFields = Object.values(fields).filter(
		(field) => !excludedFields.includes(field.id)
	);
	const onSelect = (fieldId: PubFieldsId) => {
		const field = fields[fieldId];
		onFieldSelect(fieldId, field.name, field.slug);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen} modal={modal}>
			<PopoverTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-[150px] justify-between"
				>
					Search fields
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput className="my-2 h-8" placeholder="Search fields..." />
					<CommandEmpty>No matching field found.</CommandEmpty>
					<CommandList>
						<CommandGroup>
							{availableFields.map((field) => {
								const keywords = [field.name, field.slug];
								return (
									<CommandItem
										key={field.id}
										value={field.id}
										keywords={keywords}
										onSelect={onSelect as (value: string) => void}
									>
										{field.name} ({field.slug})
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
