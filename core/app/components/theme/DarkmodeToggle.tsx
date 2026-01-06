"use client"

import { Moon, Sun } from "lucide-react"
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

	const handleClick = async (theme: "light" | "dark" | "system") => {
		const html = document.documentElement
		html.style.transition = "color background-color 0.3s ease"
		await new Promise((resolve) => setTimeout(resolve, 100))
		setTheme(theme)
		await new Promise((resolve) => setTimeout(resolve, 1000))
		html.style.transition = "none"
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{children ?? (
					<Button variant="outline" size="icon" suppressHydrationWarning>
						<Sun className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
						<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
						<span className="sr-only">Toggle theme</span>
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => handleClick("light")}>Light</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleClick("dark")}>Dark</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleClick("system")}>System</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

// needs to be kinda silly like this otherwise you get a ton of hydration errors
export function SidebarDarkmodeToggle() {
	return (
		<DarkmodeToggle>
			<SidebarMenuButton>
				<Moon className="hidden h-[1.2rem] w-[1.2rem] dark:flex" />
				<span className="hidden dark:flex">Dark</span>
				<Sun className="flex h-[1.2rem] w-[1.2rem] dark:hidden" suppressHydrationWarning />
				<span className="flex dark:hidden">Light</span>
			</SidebarMenuButton>
		</DarkmodeToggle>
	)
}
