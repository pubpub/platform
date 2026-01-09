"use client"

import { ArrowUpDownIcon, SortAsc, SortDesc } from "lucide-react"

import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"

type SortOption = {
	id: string
	label: string
}

type SortDropdownProps<T extends SortOption[]> = {
	options: T
	currentSort?: { id: T[number]["id"]; desc: boolean }
	onSortChange: (sortId: T[number]["id"], desc: boolean) => void
}

export const SortDropdown = <const T extends SortOption[]>({
	options,
	currentSort,
	onSortChange,
}: SortDropdownProps<T>) => {
	const currentOption = options.find((opt) => opt.id === currentSort?.id)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="h-9">
					{currentSort ? (
						currentSort.desc ? (
							<SortDesc size={16} />
						) : (
							<SortAsc size={16} />
						)
					) : (
						<ArrowUpDownIcon size={16} />
					)}
					{currentOption?.label ?? "Sort"}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{options.map((option) => (
					<DropdownMenuItem
						key={option.id}
						onClick={() =>
							onSortChange(
								option.id,
								currentSort?.id === option.id ? !currentSort.desc : true
							)
						}
					>
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
