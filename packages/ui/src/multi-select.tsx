"use client"

import type { VariantProps } from "class-variance-authority"

import * as React from "react"
import { cva } from "class-variance-authority"
import { CheckIcon, ChevronDown, ChevronUp, WandSparkles, XCircle, XIcon } from "lucide-react"

import { cn } from "utils"

import { Badge } from "./badge"
import { Button } from "./button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Separator } from "./separator"

const ICON_CLASSNAME = "mx-2 h-4 cursor-pointer text-muted-foreground"

const multiSelectVariants = cva(
	"hover:-translate-y-1 m-1 transition delay-150 duration-300 ease-in-out hover:scale-110",
	{
		variants: {
			variant: {
				default: "border-foreground/10 bg-card text-foreground hover:bg-card/80",
				secondary:
					"border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
				inverted: "inverted",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

interface MultiSelectProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof multiSelectVariants> {
	options: {
		label: string
		value: string
		icon?: React.ComponentType<{ className?: string }>
		node?: React.ReactNode
	}[]
	onValueChange: (value: string[]) => void
	defaultValue: string[]
	placeholder?: string
	animation?: number
	maxCount?: number
	asChild?: boolean
	children?: React.ReactNode
	className?: string
	badgeClassName?: string
	showClearAll?: boolean
}

const XButton = ({
	className,
	onClick,
	dataTestId,
}: {
	className?: string
	onClick: () => void
	dataTestId: string
}) => (
	// biome-ignore lint/a11y/useSemanticElements: sadly cannot, as you cannot nest buttons
	<span
		role="button"
		tabIndex={0}
		data-testid={dataTestId}
		className={cn("h-4 w-4 cursor-pointer rounded-full hover:bg-white/20", className)}
		onClick={(event) => {
			event.stopPropagation()
			onClick()
		}}
		onKeyDown={(event) => {
			if (event.key === "Enter" || event.key === " ") {
				onClick()
			}
		}}
	>
		<XCircle />
	</span>
)

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
	(
		{
			options,
			onValueChange,
			variant,
			defaultValue = [],
			placeholder = "Select options",
			animation = 0,
			maxCount = 3,
			asChild = false,
			children,
			className,
			badgeClassName,
			showClearAll = true,
			...props
		},
		ref
	) => {
		const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue)
		const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
		const [isAnimating, setIsAnimating] = React.useState(false)

		React.useEffect(() => {
			if (JSON.stringify(selectedValues) !== JSON.stringify(defaultValue)) {
				setSelectedValues(defaultValue)
			}
		}, [defaultValue, selectedValues])

		const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				setIsPopoverOpen(true)
			} else if (event.key === "Backspace" && !event.currentTarget.value) {
				const newSelectedValues = [...selectedValues]
				newSelectedValues.pop()
				setSelectedValues(newSelectedValues)
				onValueChange(newSelectedValues)
			}
		}

		const toggleOption = (value: string) => {
			const newSelectedValues = selectedValues.includes(value)
				? selectedValues.filter((v) => v !== value)
				: [...selectedValues, value]
			setSelectedValues(newSelectedValues)
			onValueChange(newSelectedValues)
		}

		const handleClear = () => {
			setSelectedValues([])
			onValueChange([])
		}

		const _handleTogglePopover = () => {
			setIsPopoverOpen((prev) => !prev)
		}

		const clearExtraOptions = () => {
			const newSelectedValues = selectedValues.slice(0, maxCount)
			setSelectedValues(newSelectedValues)
			onValueChange(newSelectedValues)
		}

		const toggleAll = () => {
			if (selectedValues.length === options.length) {
				handleClear()
			} else {
				const allValues = options.map((option) => option.value)
				setSelectedValues(allValues)
				onValueChange(allValues)
			}
		}

		return (
			<Popover
				open={isPopoverOpen}
				onOpenChange={(open) => {
					setIsPopoverOpen(open)
				}}
			>
				<PopoverTrigger asChild>
					{children ?? (
						<Button
							ref={ref}
							{...props}
							className={cn(
								"flex h-auto min-h-10 w-full items-center justify-between rounded-md border bg-inherit px-3 py-2 hover:bg-inherit",
								className
							)}
						>
							{selectedValues.length > 0 ? (
								<div className="flex w-full items-center justify-between">
									<div className="flex flex-wrap items-center">
										{selectedValues.slice(0, maxCount).map((value) => {
											const option = options.find((o) => o.value === value)
											const IconComponent = option?.icon
											return (
												<Badge
													key={value}
													className={cn(
														isAnimating ? "animate-bounce" : "",
														multiSelectVariants({
															variant,
															className: badgeClassName,
														}),
														"flex items-center gap-2",
														badgeClassName
													)}
													style={{ animationDuration: `${animation}s` }}
												>
													{IconComponent && (
														<IconComponent className="mr-2 h-4 w-4" />
													)}

													{option?.label}
													<XButton
														onClick={() => toggleOption(value)}
														dataTestId={`multi-select-remove-${value}`}
													/>
												</Badge>
											)
										})}
										{selectedValues.length > maxCount && (
											<Badge
												className={cn(
													"border-foreground/1 bg-transparent text-foreground hover:bg-transparent",
													isAnimating ? "animate-bounce" : "",
													multiSelectVariants({
														variant,
														className: badgeClassName,
													}),
													"flex items-center gap-2",
													badgeClassName
												)}
												style={{ animationDuration: `${animation}s` }}
											>
												{`+ ${selectedValues.length - maxCount} more`}
												<XButton
													onClick={clearExtraOptions}
													className="hover:bg-black/20"
													dataTestId={`multi-select-clear-extra`}
												/>
											</Badge>
										)}
									</div>
									<div className="flex items-center justify-between">
										{showClearAll && (
											<XIcon
												className={ICON_CLASSNAME}
												data-testid={`multi-select-clear-all`}
												onClick={(event) => {
													event.stopPropagation()
													handleClear()
												}}
											/>
										)}
										<Separator
											orientation="vertical"
											className="flex h-full min-h-6"
										/>
										{isPopoverOpen ? (
											<ChevronUp className={ICON_CLASSNAME} />
										) : (
											<ChevronDown className={ICON_CLASSNAME} />
										)}
									</div>
								</div>
							) : (
								<div className="mx-auto flex w-full items-center justify-between">
									<span className="mx-3 text-muted-foreground text-sm">
										{placeholder}
									</span>
									{isPopoverOpen ? (
										<ChevronUp className={ICON_CLASSNAME} />
									) : (
										<ChevronDown className={ICON_CLASSNAME} />
									)}
								</div>
							)}
						</Button>
					)}
				</PopoverTrigger>
				<PopoverContent
					className="w-auto p-0"
					align="start"
					onEscapeKeyDown={() => setIsPopoverOpen(false)}
				>
					<Command className="overflow-clip rounded-lg">
						<CommandInput placeholder="Search..." onKeyDown={handleInputKeyDown} />
						<CommandSeparator />
						<CommandList className="max-h-[300px] overflow-y-auto">
							<CommandEmpty>No results found.</CommandEmpty>
							<CommandGroup>
								<CommandItem
									key="all"
									onSelect={toggleAll}
									className="cursor-pointer"
									data-testid={`multi-select-toggle-all`}
								>
									<div
										className={cn(
											"mr-2 flex h-4 w-4 items-center justify-center rounded-xs border border-primary",
											selectedValues.length === options.length
												? "bg-primary text-primary-foreground"
												: "opacity-50 [&_svg]:invisible"
										)}
									>
										<CheckIcon className="h-4 w-4" />
									</div>
									<span>(Select All)</span>
								</CommandItem>
								{options.map((option) => {
									const isSelected = selectedValues.includes(option.value)
									return (
										<CommandItem
											key={option.value}
											onSelect={() => toggleOption(option.value)}
											className="cursor-pointer"
											data-testid={`multi-select-option-${option.value}`}
										>
											<div
												className={cn(
													"mr-2 flex h-4 w-4 items-center justify-center rounded-xs border border-primary",
													isSelected
														? "bg-primary text-primary-foreground"
														: "opacity-50 [&_svg]:invisible"
												)}
											>
												<CheckIcon className="h-4 w-4" />
											</div>
											{option.icon && (
												<option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
											)}
											{option.node ?? <span>{option.label}</span>}
										</CommandItem>
									)
								})}
							</CommandGroup>
						</CommandList>
						<CommandSeparator />
						<CommandGroup>
							<div className="flex items-center justify-between">
								{showClearAll && selectedValues.length > 0 && (
									<>
										<Button
											onClick={handleClear}
											variant="ghost"
											className="flex-1 cursor-pointer justify-center"
											data-testid={`multi-select-clear`}
										>
											Clear
										</Button>
										<Separator
											orientation="vertical"
											className="flex h-full min-h-6"
										/>
									</>
								)}
								<CommandSeparator />
								<Button
									onClick={() => setIsPopoverOpen(false)}
									variant="ghost"
									className="flex-1 cursor-pointer justify-center"
									data-testid={`multi-select-close`}
								>
									Close
								</Button>
							</div>
						</CommandGroup>
					</Command>
				</PopoverContent>
				{animation > 0 && selectedValues.length > 0 && (
					<WandSparkles
						className={cn(
							"my-2 h-3 w-3 cursor-pointer bg-background text-foreground",
							isAnimating ? "" : "text-muted-foreground"
						)}
						onClick={() => setIsAnimating(!isAnimating)}
					/>
				)}
			</Popover>
		)
	}
)

MultiSelect.displayName = "MultiSelect"
