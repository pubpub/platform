"use client";

import React, { useCallback, useContext } from "react";

import { Button } from "ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "ui/command";
import { Check, ChevronsUpDown } from "ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { cn } from "utils";

import { type PubFieldsId } from "~/kysely/types/public/PubFields";
import { type PubTypesId } from "~/kysely/types/public/PubTypes";
import { useServerAction } from "~/lib/serverActions";
import { addPubField } from "./actions";
import { useFields } from "./FieldsProvider";

export type AddFieldProps = {
	pubTypeId: PubTypesId;
	excludedFields: PubFieldsId[];
};

export function AddField({ pubTypeId, excludedFields }: AddFieldProps) {
	const [open, setOpen] = React.useState(false);
	const runAddPubField = useServerAction(addPubField);
	const onSelect = useCallback(
		(fieldId: string) => {
			runAddPubField(pubTypeId, fieldId as PubFieldsId);
			setOpen(false);
		},
		[pubTypeId]
	);
	const fields = useFields().filter((field) => !excludedFields.includes(field.id));

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					role="combobox"
					name="Assign"
					aria-expanded={open}
					className="w-[150px] justify-between"
				>
					Select a field to add
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput className="my-2 h-8" placeholder="Search fields..." />
					<CommandEmpty>No matching field found.</CommandEmpty>
					<CommandList>
						<CommandGroup>
							{fields.map((field) => {
								const keywords = [field.name, field.slug];
								return (
									<CommandItem
										key={field.id}
										value={field.id}
										keywords={keywords}
										onSelect={onSelect}
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
