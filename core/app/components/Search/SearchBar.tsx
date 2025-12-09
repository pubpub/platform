"use client"

import type { ReactNode } from "react"

import { useRef } from "react"
import { Search, X } from "lucide-react"

import { KeyboardShortcutPriority, useKeyboardShortcut, usePlatformModifierKey } from "ui/hooks"
import { Input } from "ui/input"
import { cn } from "utils"

type SearchBarProps = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
	actions?: ReactNode
}

export const SearchBar = ({
	value,
	onChange,
	placeholder = "Search...",
	className,
	actions,
}: SearchBarProps) => {
	const inputRef = useRef<HTMLInputElement>(null)
	const { symbol, platform } = usePlatformModifierKey()

	useKeyboardShortcut(
		"Mod+k",
		() => {
			inputRef.current?.focus()
			inputRef.current?.select()
		},
		{
			priority: KeyboardShortcutPriority.MEDIUM,
		}
	)

	const handleClear = () => {
		onChange("")
	}

	return (
		<div
			className={cn(
				"sticky top-0 z-20 mt-0 flex w-full items-center gap-x-2 border-b bg-white px-4 py-2",
				className
			)}
		>
			<div className="relative flex flex-1 items-center gap-x-2">
				<Search
					className="-translate-y-1/2 absolute top-1/2 left-2 text-gray-500"
					size={16}
				/>
				<Input
					ref={inputRef}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className={cn("bg-white pl-8 tracking-wide shadow-none", value && "pr-8")}
				/>
				<span className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center font-mono text-gray-500 text-xs opacity-50 md:flex">
					{value && (
						<button
							onClick={handleClear}
							className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:right-16"
							type="button"
							aria-label="Clear search"
						>
							<X size={14} />
						</button>
					)}
					<span
						className={cn(
							"flex w-10 items-center justify-center gap-x-1 transition-opacity duration-200",
							{
								"opacity-0": platform === "unknown",
							}
						)}
					>
						<span className={cn({ "mt-0.5 text-lg": platform === "mac" })}>
							{symbol}
						</span>{" "}
						K
					</span>
				</span>
			</div>
			{actions}
		</div>
	)
}
