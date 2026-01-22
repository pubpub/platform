"use client"

import type { ReactNode } from "react"

import React, { Children, isValidElement, useMemo } from "react"
import { MoreHorizontal } from "lucide-react"

import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { SidebarTrigger } from "ui/sidebar"
import { Skeleton } from "ui/skeleton"
import { cn } from "utils"

// defined here to avoid importing from SideNav which has server-only deps
const COLLAPSIBLE_TYPE: "icon" | "offcanvas" | "none" = "icon"

type ContentLayoutContextValue = {
	hasLeft: boolean
}

const ContentLayoutContext = React.createContext<ContentLayoutContextValue>({
	hasLeft: true,
})

function ContentLayoutIcon({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<span
			data-slot="content-layout-icon"
			className={cn("mr-2 text-muted-foreground", className)}
		>
			{children}
		</span>
	)
}

function ContentLayoutTitle({ className, children }: { className?: string; children: ReactNode }) {
	const { hasLeft } = React.useContext(ContentLayoutContext)

	return (
		<h1
			data-slot="content-layout-title"
			data-no-left={!hasLeft}
			className={cn(
				"flex flex-row items-center font-medium",
				// when there's no left element, left-justify on mobile
				"data-[no-left=true]:flex-1 data-[no-left=true]:md:flex-initial",
				className
			)}
		>
			{children}
		</h1>
	)
}

type ActionItem = {
	label: string
	icon?: ReactNode
	onClick?: () => void
	href?: string
	variant?: "default" | "destructive" | "ghost"
}

function ContentLayoutActions({
	className,
	children,
	items,
}: {
	className?: string
	children?: ReactNode
	items?: ActionItem[]
}) {
	const childArray = Children.toArray(children).filter(isValidElement)
	const actionCount = items?.length ?? childArray.length

	// if we have items array, render from that
	if (items && items.length > 0) {
		return (
			<div
				data-slot="content-layout-actions"
				className={cn("flex items-center gap-2", className)}
			>
				{actionCount > 1 ? (
					<>
						<div className="hidden items-center gap-2 md:flex">
							{items.map((item, idx) => (
								<ActionButton key={idx} item={item} />
							))}
						</div>
						<div className="md:hidden">
							<ActionsDropdown items={items} />
						</div>
					</>
				) : (
					items.map((item, idx) => <ActionButton key={idx} item={item} />)
				)}
			</div>
		)
	}

	// otherwise use children
	if (actionCount <= 1) {
		return (
			<div
				data-slot="content-layout-actions"
				className={cn("flex items-center gap-2", className)}
			>
				{children}
			</div>
		)
	}

	return (
		<div
			data-slot="content-layout-actions"
			className={cn("flex items-center gap-2", className)}
		>
			<div className="hidden items-center gap-2 md:flex">{children}</div>
			<div className="md:hidden">
				<ChildrenDropdown>{children}</ChildrenDropdown>
			</div>
		</div>
	)
}

function ActionButton({ item }: { item: ActionItem }) {
	const variant = item.variant ?? "default"
	if (item.href) {
		return (
			<Button variant={variant === "default" ? "outline" : variant} size="sm" asChild>
				<a href={item.href}>
					{item.icon}
					<span>{item.label}</span>
				</a>
			</Button>
		)
	}
	return (
		<Button
			variant={variant === "default" ? "outline" : variant}
			size="sm"
			onClick={item.onClick}
		>
			{item.icon}
			<span>{item.label}</span>
		</Button>
	)
}

function ActionsDropdown({ items }: { items: ActionItem[] }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm">
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{items.map((item, idx) => (
					<DropdownMenuItem
						key={idx}
						onClick={item.onClick}
						variant={item.variant === "destructive" ? "destructive" : "default"}
						asChild={!!item.href}
					>
						{item.href ? (
							<a href={item.href}>
								{item.icon}
								<span>{item.label}</span>
							</a>
						) : (
							<>
								{item.icon}
								<span>{item.label}</span>
							</>
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function ChildrenDropdown({ children }: { children: ReactNode }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm">
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="flex flex-col gap-1 p-2">
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function ContentLayoutLeft({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<div data-slot="content-layout-left" className={cn("flex items-center", className)}>
			{children}
		</div>
	)
}

function ContentLayoutBody({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<div
			data-slot="content-layout-body"
			className={cn("h-full flex-1 overflow-auto rounded-tl-xl bg-background p-4", className)}
		>
			{children}
		</div>
	)
}

function ContentLayoutHeader({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<header
			data-slot="content-layout-header"
			className={cn(
				"z-20 flex h-16 items-center justify-between gap-2 bg-sidebar p-4 dark:border-0",
				className
			)}
		>
			{COLLAPSIBLE_TYPE === "icon" ? null : <SidebarTrigger />}
			{children}
		</header>
	)
}

// skeleton variants
function ContentLayoutTitleSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-center", className)}>
			<Skeleton className="mr-2 size-6 rounded-full" />
			<Skeleton className="h-6 w-32 md:w-48" />
		</div>
	)
}

function ContentLayoutActionsSkeleton({
	className,
	count = 1,
}: {
	className?: string
	count?: number
}) {
	return (
		<div className={cn("hidden items-center gap-2 md:flex", className)}>
			{Array.from({ length: count }).map((_, idx) => (
				<Skeleton key={idx} className="h-8 w-20" />
			))}
		</div>
	)
}

function ContentLayoutBodySkeleton({
	className,
	children,
}: {
	className?: string
	children?: ReactNode
}) {
	return (
		<div
			data-slot="content-layout-body"
			className={cn("h-full flex-1 overflow-auto rounded-tl-xl bg-background", className)}
		>
			{children}
		</div>
	)
}

type ContentLayoutRootProps = {
	children: ReactNode
	className?: string
}

function ContentLayoutRoot({ children, className }: ContentLayoutRootProps) {
	// detect if we have a left slot
	const hasLeft = useMemo(() => {
		let found = false
		Children.forEach(children, (child) => {
			if (isValidElement(child)) {
				const props = child.props as { "data-slot"?: string; children?: ReactNode }
				if (props["data-slot"] === "content-layout-left") {
					found = true
				}
				// check nested header children
				if (child.type === ContentLayoutHeader && props.children) {
					Children.forEach(props.children, (headerChild) => {
						if (isValidElement(headerChild)) {
							const headerProps = headerChild.props as { "data-slot"?: string }
							if (headerProps["data-slot"] === "content-layout-left") {
								found = true
							}
						}
					})
				}
			}
		})
		return found
	}, [children])

	return (
		<ContentLayoutContext.Provider value={{ hasLeft }}>
			<div data-slot="content-layout" className={cn("absolute inset-0 w-full", className)}>
				<div className="flex h-full flex-col">{children}</div>
			</div>
		</ContentLayoutContext.Provider>
	)
}

// legacy compat: the old heading component
const LegacyHeading = ({
	title,
	left,
	right,
}: {
	title: ReactNode
	left?: ReactNode
	right?: ReactNode
}) => {
	const hasLeft = !!left
	return (
		<ContentLayoutContext.Provider value={{ hasLeft }}>
			<header className="z-20 flex h-16 items-center justify-between bg-sidebar p-4 dark:border-0">
				{COLLAPSIBLE_TYPE === "icon" ? null : <SidebarTrigger />}
				{left}
				<ContentLayoutTitle>{title}</ContentLayoutTitle>
				{right && <ContentLayoutActions>{right}</ContentLayoutActions>}
			</header>
		</ContentLayoutContext.Provider>
	)
}

// legacy api for backwards compat
export const ContentLayout = ({
	title,
	left,
	right,
	children,
	className,
}: {
	title: ReactNode
	left?: ReactNode
	right?: ReactNode
	children: ReactNode
	className?: string
}) => {
	return (
		<div className="absolute inset-0 w-full">
			<div className="flex h-full flex-col">
				<LegacyHeading title={title} left={left} right={right} />
				<div
					className={cn(
						"relative h-full flex-1 overflow-auto rounded-tl-xl bg-background",
						className
					)}
				>
					{children}
				</div>
			</div>
		</div>
	)
}

// compound components for new api
ContentLayout.Root = ContentLayoutRoot
ContentLayout.Header = ContentLayoutHeader
ContentLayout.Icon = ContentLayoutIcon
ContentLayout.Title = ContentLayoutTitle
ContentLayout.Actions = ContentLayoutActions
ContentLayout.Left = ContentLayoutLeft
ContentLayout.Body = ContentLayoutBody

// skeleton components
ContentLayout.TitleSkeleton = ContentLayoutTitleSkeleton
ContentLayout.ActionsSkeleton = ContentLayoutActionsSkeleton
ContentLayout.BodySkeleton = ContentLayoutBodySkeleton

export {
	ContentLayoutRoot,
	ContentLayoutHeader,
	ContentLayoutIcon,
	ContentLayoutTitle,
	ContentLayoutActions,
	ContentLayoutLeft,
	ContentLayoutBody,
	ContentLayoutTitleSkeleton,
	ContentLayoutActionsSkeleton,
	ContentLayoutBodySkeleton,
}
