"use client"

import { Computer, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { SidebarMenuButton } from "ui/sidebar"

export function DarkmodeToggle({ children }: { children?: React.ReactNode }) {
	const { setTheme } = useTheme()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{children ?? (
					<Button variant="outline" size="icon">
						<Sun className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
						<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
						<span className="sr-only">Toggle theme</span>
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export function SidebarDarkmodeToggle() {
	const { theme } = useTheme()

	return (
		<DarkmodeToggle>
			<SidebarMenuButton>
				{theme === "dark" ? (
					<>
						<Moon className="h-[1.2rem] w-[1.2rem]" />
						<span>Dark</span>
					</>
				) : theme === "light" ? (
					<>
						<Sun className="h-[1.2rem] w-[1.2rem]" />
						<span>Light</span>
					</>
				) : (
					<>
						<Computer className="h-[1.2rem] w-[1.2rem]" />
						<span>System</span>
					</>
				)}
			</SidebarMenuButton>
		</DarkmodeToggle>
	)
}
