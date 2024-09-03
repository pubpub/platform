"use client";

import * as React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { cn } from "utils";

type Props = { href: string; text: string; icon: React.ReactNode; count?: number };

export default function NavLink({ href, text, icon, count }: Props) {
	const layoutSegment = useSelectedLayoutSegment();
	const isActive = layoutSegment ? new RegExp(`c\\/.*?\\/${layoutSegment}$`).test(href) : false;
	return (
		<Link
			className={cn(
				"-mx-1 flex items-center rounded-md px-1 py-3 hover:bg-gray-100",
				isActive && "text-bold bg-gray-200 hover:bg-gray-200"
			)}
			href={href}
		>
			<div className="ml-2 mr-3 w-4">{icon}</div>
			<div className="flex-auto text-sm font-bold">{text}</div>
			{count && (
				<div className="rounded-md border border-gray-200 px-2 text-sm font-bold">
					{count}
				</div>
			)}
		</Link>
	);
}
