import type { KeyboardEvent } from "react";

import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Check, X } from "lucide-react";

import { cn } from "utils";

import { Button } from "./button";
import { CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Skeleton } from "./skeleton";

export type Option = { value: string; label: string; node?: React.ReactNode };

type AutoCompleteProps = {
	options: Option[];
	empty: React.ReactNode;
	value?: Option;
	onValueChange?: (value: Option) => void;
	onInputValueChange?: (value: string) => void;
	onClose?: () => void;
	isLoading?: boolean;
	disabled?: boolean;
	placeholder?: string;
	icon?: React.ReactNode;
	name?: string;
	// If included, will render a clear button in the input
	onClear?: () => void;
};

export const AutoComplete = ({
	options,
	placeholder,
	empty,
	value,
	onValueChange,
	onInputValueChange,
	onClose,
	disabled,
	isLoading = false,
	icon,
	name,
	onClear,
}: AutoCompleteProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const [isOpen, setOpen] = useState(false);
	const [selected, setSelected] = useState<Option | undefined>(value as Option);
	const [inputValue, setInputValue] = useState<string>(value?.label || "");

	const _setInputValue = useCallback(
		(value: string) => {
			setInputValue(value);
			onInputValueChange?.(value);
		},
		[onInputValueChange, setInputValue]
	);

	const close = useCallback(() => {
		setOpen(false);
		onClose?.();
	}, [onClose]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			const input = inputRef.current;
			if (!input) {
				return;
			}

			// Keep the options displayed when the user is typing
			if (!isOpen) {
				setOpen(true);
			}

			// This is not a default behaviour of the <input /> field
			if (event.key === "Enter" && input.value !== "") {
				const optionToSelect = options.find((option) => option.label === input.value);
				if (optionToSelect) {
					setSelected(optionToSelect);
					onValueChange?.(optionToSelect);
				}
			}

			if (event.key === "Escape") {
				close();
			}
		},
		[isOpen, options, onValueChange, close]
	);

	const handleSelectOption = useCallback(
		(selectedOption: Option) => {
			_setInputValue(selectedOption.label);

			setSelected(selectedOption);
			onValueChange?.(selectedOption);

			// This is a hack to prevent the input from being focused after the user selects an option
			// We can call this hack: "The next tick"
			setTimeout(() => {
				close();
			}, 0);
		},
		[onValueChange, _setInputValue, close]
	);

	const commandRef = useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const handler = (event: MouseEvent) => {
			if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
				close();
				if (selected && inputValue !== "") {
					_setInputValue(selected.label);
				}
			}
		};

		document.addEventListener("click", handler);

		return () => {
			document.removeEventListener("click", handler);
		};
	}, [selected, _setInputValue, close, inputValue]);

	return (
		<CommandPrimitive onKeyDown={handleKeyDown} ref={commandRef} className="relative">
			<CommandInput
				name={name}
				ref={inputRef}
				value={inputValue}
				onValueChange={isLoading ? undefined : _setInputValue}
				onFocus={() => setOpen(true)}
				placeholder={placeholder}
				disabled={disabled}
				icon={icon}
				data-testid={`autocomplete-${name}`}
			/>
			{onClear ? (
				<Button
					variant="ghost"
					size="icon"
					className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
					onClick={() => {
						setInputValue("");
						onClear();
					}}
				>
					<X />
					<span className="sr-only">Clear</span>
				</Button>
			) : null}
			<div className="relative mt-1 flex">
				<div
					className={cn(
						"absolute top-0 z-10 w-full rounded-xl bg-background shadow-lg outline-none animate-in fade-in-0 zoom-in-95",
						isOpen ? "block" : "hidden"
					)}
				>
					<CommandList className="rounded-lg ring-1 ring-gray-200">
						{isLoading ? (
							<CommandPrimitive.Loading>
								<div className="p-1">
									<Skeleton className="h-8 w-full" />
								</div>
							</CommandPrimitive.Loading>
						) : null}
						{options.length > 0 && !isLoading ? (
							<CommandGroup>
								{options.map((option) => {
									const isSelected = selected?.value === option.value;
									return (
										<CommandItem
											key={option.value}
											value={option.label}
											onMouseDown={(event) => {
												event.preventDefault();
												event.stopPropagation();
											}}
											onSelect={() => handleSelectOption(option)}
											className={cn(
												"flex w-full items-center gap-2 rounded-lg",
												!isSelected ? "pl-8" : null
											)}
											aria-label={option.label}
										>
											{isSelected ? <Check className="w-4" /> : null}
											{option.node ?? option.label}
										</CommandItem>
									);
								})}
							</CommandGroup>
						) : null}
						{!isLoading ? (
							<CommandPrimitive.Empty
								asChild
								className="select-none rounded-sm px-2 py-3 text-center text-sm"
							>
								{empty}
							</CommandPrimitive.Empty>
						) : null}
					</CommandList>
				</div>
			</div>
		</CommandPrimitive>
	);
};
