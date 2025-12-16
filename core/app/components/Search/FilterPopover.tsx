"use client"

import type { ReactNode } from "react"

import { useState } from "react"
import { Filter } from "lucide-react"

import { Button } from "ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"

type FilterPopoverProps = {
	activeFilterCount: number
	children: ReactNode
}

export const FilterPopover = ({ activeFilterCount, children }: FilterPopoverProps) => {
	const [open, setOpen] = useState(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="h-9">
					<Filter size={16} />
					Filters
					{activeFilterCount > 0 && (
						<span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
							{activeFilterCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="space-y-4">{children}</div>
			</PopoverContent>
		</Popover>
	)
}
