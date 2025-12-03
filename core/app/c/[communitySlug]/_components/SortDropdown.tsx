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

type SortDropdownProps = {
	options: SortOption[]
	currentSort?: { id: string; desc: boolean }
	onSortChange: (sortId: string, desc: boolean) => void
}

export const SortDropdown = ({ options, currentSort, onSortChange }: SortDropdownProps) => {
	const currentOption = options.find((opt) => opt.id === currentSort?.id)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
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
