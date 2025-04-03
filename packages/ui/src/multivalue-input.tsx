// Adapted from https://gist.github.com/enesien/03ba5340f628c6c812b306da5fedd1a4

import type { Active, DragEndEvent } from "@dnd-kit/core";
import type { CSSProperties, Dispatch } from "react";

import React, { forwardRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";

import { cn } from "utils";

import type { InputProps } from "./input";
import { Badge } from "./badge";
import { Button } from "./button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./command";
import { ChevronsUpDown, GripVertical, XCircle } from "./icon";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type MultiValueInputProps = Omit<InputProps, "onChange"> & {
	value: string[];
	onChange: Dispatch<string[]>;
	/** Classname to apply to value badges */
	valueClassName?: string;
	/** List of options to constrain the entries by. If this is passed, the component will use a
	 * combobox search instead of a text input */
	options?: { value: string; label: string }[];
	/** Name for the kind of value in the options list. Should be plural, e.g. "users", "forms",
	 * "fields"  */
	optionName?: string;
	sortable?: boolean;
};

type ValueProps = {
	label: string;
	value: string;
	onRemove: (v: string) => void;
	isActive: boolean;
	disabled?: boolean;
	className?: string;
};

type SortProps = {
	children?: React.ReactNode | undefined;
	ref?: React.Ref<HTMLDivElement>;
	style?: CSSProperties;
};

const Value = ({
	disabled,
	className,
	value,
	children,
	label,
	onRemove,
	isActive,
	...props
}: ValueProps & SortProps) => {
	return (
		<Badge
			{...props}
			className={cn(
				"bg-muted-foreground py-1",
				{ "cursor-auto bg-gray-400 hover:bg-gray-400": disabled },
				className
			)}
			data-testid={`sortable-value-${value}`}
		>
			{children}
			{label ?? value}
			<Button
				onClick={() => {
					onRemove(value);
				}}
				variant="ghost"
				// height is smaller so hover is only over the xcircle
				className="ml-2 h-3 p-0"
				data-testid="remove-button"
				disabled={disabled}
			>
				<XCircle size="12"></XCircle>
			</Button>
		</Badge>
	);
};

const SortableValue = (props: ValueProps) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: props.value,
		disabled: props.disabled,
	});

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition,
				zIndex: props.isActive ? 50 : undefined,
			}
		: undefined;

	return (
		<Value ref={setNodeRef} style={style} {...attributes} {...props}>
			<Button
				{...listeners}
				variant="ghost"
				className="mr-1 h-5 p-0"
				disabled={props.disabled}
			>
				<GripVertical size="12" />
			</Button>
		</Value>
	);
};

const ComboBoxInput = ({
	options,
	onSelect,
	optionName,
	disabled,
	ref,
	...props
}: {
	options: { value: string; label: string }[];
	onSelect: (value: string) => void;
	optionName?: string;
	disabled: boolean | undefined;
	ref: React.ForwardedRef<HTMLInputElement>;
} & React.RefAttributes<HTMLInputElement>) => {
	const [open, setOpen] = useState(false);
	const label = `Search ${optionName ?? "options"}`;
	return (
		<Popover open={open} onOpenChange={setOpen} modal={false}>
			<PopoverTrigger asChild disabled={disabled}>
				<Button
					size="sm"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-[150px] justify-between"
					aria-label={label}
				>
					{label}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput
						className="my-2 h-8"
						placeholder={`${label}...`}
						disabled={disabled}
						ref={ref}
						data-testid="multivalue-input"
						{...props}
					/>
					<CommandEmpty>No {optionName ?? "match"} found.</CommandEmpty>
					<CommandList label={`Available ${optionName ?? "options"}`}>
						<CommandGroup>
							{options.map((option) => {
								return (
									<CommandItem
										key={option.value}
										value={option.value}
										onSelect={(value) => {
											setOpen(false);
											onSelect(value);
										}}
										keywords={[option.label]}
									>
										{option.label}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export const MultiValueInput = forwardRef<HTMLInputElement, MultiValueInputProps>(
	(
		{
			value: values,
			onChange,
			valueClassName,
			disabled,
			options,
			optionName,
			sortable = true,
			...props
		},
		ref
	) => {
		const [pendingValue, setPendingValue] = useState("");
		const [activeDrag, setActiveDrag] = useState<Active | null>(null);

		const addPendingValue = () => {
			if (pendingValue) {
				addValue(pendingValue);
				setPendingValue("");
			}
		};

		const addValue = (value: string) => {
			const newValues = new Set([...values, value]);
			onChange(Array.from(newValues));
		};

		const handleDragEnd = (event: DragEndEvent) => {
			const { active, over } = event;
			if (over && active.id !== over.id) {
				const activeIndex: number = values.findIndex((v) => v === active.id);
				const overIndex: number = values.findIndex((v) => v === over.id);
				onChange(arrayMove(values, activeIndex, overIndex));
			}
			setActiveDrag(null);
		};

		return (
			<div className="isolate flex flex-col gap-2">
				{options?.length ? (
					<ComboBoxInput
						options={options.filter((option) => !values.includes(option.value))}
						optionName={optionName}
						onSelect={addValue}
						disabled={disabled}
						ref={ref}
					/>
				) : (
					<Input
						value={pendingValue}
						onChange={(e) => setPendingValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === ",") {
								e.preventDefault();
								addPendingValue();
							}
						}}
						placeholder="Type the value and hit enter"
						disabled={disabled}
						{...props}
						ref={ref}
						data-testid="multivalue-input"
					/>
				)}

				<DndContext
					onDragStart={({ active }) => {
						setActiveDrag(active);
					}}
					onDragEnd={handleDragEnd}
					// Need an id or else will get an error in the console
					// https://github.com/clauderic/dnd-kit/issues/926
					id="multivalue-dnd-context"
				>
					<SortableContext items={values}>
						<div className="flex flex-wrap gap-x-2 gap-y-2">
							{values.map((value) => {
								let label = value;
								if (options?.length) {
									const option = options.find((option) => option.value === value);
									if (option) {
										label = option.label;
									}
								}
								let ValueElement = SortableValue;
								if (!sortable) {
									ValueElement = Value;
								}

								return (
									<ValueElement
										label={label}
										key={value}
										value={value}
										onRemove={(valueToRemove) =>
											onChange(values.filter((v) => v !== valueToRemove))
										}
										isActive={activeDrag?.id === value}
										disabled={disabled}
										className={valueClassName}
									/>
								);
							})}
						</div>
					</SortableContext>
				</DndContext>
			</div>
		);
	}
);

MultiValueInput.displayName = "MultiValueInput";
