"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import "react-day-picker/style.css"

import { cn } from "utils"

import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
	const defaultClassNames = getDefaultClassNames()

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-3", className)}
			classNames={{
				root: cn("w-fit", defaultClassNames.root),
				months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
				month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
				nav: cn(
					"absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
					defaultClassNames.nav
				),
				button_previous: cn(
					buttonVariants({ variant: "ghost" }),
					"size-(--cell-size) select-none p-0 aria-disabled:opacity-50",
					defaultClassNames.button_previous
				),
				button_next: cn(
					buttonVariants({ variant: "ghost" }),
					"size-(--cell-size) select-none p-0 aria-disabled:opacity-50",
					defaultClassNames.button_next
				),
				month_caption: cn(
					"flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
					defaultClassNames.month_caption
				),
				dropdowns: cn(
					"flex h-(--cell-size) w-full items-center justify-center gap-1.5 font-medium text-sm",
					defaultClassNames.dropdowns
				),
				dropdown_root: cn(
					"relative rounded-md border border-input shadow-xs has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50",
					defaultClassNames.dropdown_root
				),
				dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
				caption_label: cn(
					"select-none font-medium",
					"flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
					defaultClassNames.caption_label
				),
				table: "w-full border-collapse",
				weekdays: cn("flex", defaultClassNames.weekdays),
				weekday: cn(
					"flex-1 select-none rounded-md font-normal text-[0.8rem] text-muted-foreground",
					defaultClassNames.weekday
				),
				week: cn("mt-2 flex w-full", defaultClassNames.week),
				week_number_header: cn(
					"w-(--cell-size) select-none",
					defaultClassNames.week_number_header
				),
				week_number: cn(
					"select-none text-[0.8rem] text-muted-foreground",
					defaultClassNames.week_number
				),
				day: cn(
					"group/day relative aspect-square h-full w-full select-none p-0 text-center text-sm [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
					defaultClassNames.day
				),
				range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
				range_middle: cn("rounded-none", defaultClassNames.range_middle),
				range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
				today: cn(
					"rounded-md bg-accent text-accent-foreground data-[selected=true]:rounded-none",
					defaultClassNames.today
				),
				outside: cn(
					"text-muted-foreground aria-selected:text-muted-foreground",
					defaultClassNames.outside
				),
				disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
				hidden: cn("invisible", defaultClassNames.hidden),
				...classNames,
			}}
			{...props}
		/>
	)
}
Calendar.displayName = "Calendar"

export { Calendar }
