import * as React from "react";
import Link from "next/link";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "utils";

import type { ButtonProps } from "./button";
import { buttonVariants } from "./button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
	<nav
		role="navigation"
		aria-label="pagination"
		className={cn("mx-auto flex w-full justify-center", className)}
		{...props}
	/>
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
	({ className, ...props }, ref) => (
		<ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
	)
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
	({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
	isActive?: boolean;
	iconOnly?: boolean;
} & Partial<Pick<ButtonProps, "size">> &
	React.ComponentProps<typeof Link>;

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
	<Link
		aria-current={isActive ? "page" : undefined}
		className={cn(
			buttonVariants({
				variant: isActive ? "outline" : "ghost",
				size,
			}),
			className
		)}
		{...props}
	/>
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
	className,
	iconOnly,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to previous page"
		size="default"
		className={cn("gap-1 pl-2.5", className)}
		{...props}
	>
		<ChevronLeft className="h-4 w-4" />
		<span className={cn({ "sr-only": iconOnly })}>Previous</span>
	</PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationFirst = ({
	className,
	iconOnly,
	...props
}: React.ComponentProps<typeof PaginationLink>) => {
	return (
		<PaginationLink
			aria-label="Go to first page"
			size="default"
			className={cn("gap-1 px-2.5", className)}
			{...props}
		>
			<span className={cn({ "sr-only": iconOnly })}>First</span>
			<ChevronsLeft className="h-4 w-4" />
		</PaginationLink>
	);
};
PaginationFirst.displayName = "PaginationFirst";

const PaginationNext = ({
	className,
	iconOnly,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to next page"
		size="default"
		className={cn("gap-1 pr-2.5", className)}
		{...props}
	>
		<span className={cn({ "sr-only": iconOnly })}>Next</span>
		<ChevronRight className="h-4 w-4" />
	</PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationLast = ({
	className,
	iconOnly,
	...props
}: React.ComponentProps<typeof PaginationLink>) => {
	return (
		<PaginationLink
			aria-label="Go to last page"
			size="default"
			className={cn("gap-1 px-2.5", className)}
			{...props}
		>
			<span className={cn({ "sr-only": iconOnly })}>Last</span>
			<ChevronsRight className="h-4 w-4" />
		</PaginationLink>
	);
};
PaginationLast.displayName = "PaginationLast";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
	<span
		aria-hidden
		className={cn("flex h-9 w-9 items-center justify-center", className)}
		{...props}
	>
		<DotsHorizontalIcon className="h-4 w-4" />
		<span className="sr-only">More pages</span>
	</span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
	Pagination,
	PaginationContent,
	PaginationLink,
	PaginationItem,
	PaginationFirst,
	PaginationLast,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
};
