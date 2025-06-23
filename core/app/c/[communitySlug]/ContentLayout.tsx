import type { ReactNode } from "react";

import { SidebarTrigger } from "ui/sidebar";

import { COLLAPSIBLE_TYPE } from "./SideNav";

const Heading = ({
	title,
	left,
	right,
}: {
	title: ReactNode;
	left?: ReactNode;
	right?: ReactNode;
}) => {
	return (
		<header className="z-20 flex h-[72px] items-center justify-between border-b bg-gray-50 p-4 shadow-md">
			{COLLAPSIBLE_TYPE === "icon" ? null : <SidebarTrigger />}
			{left}
			<h1 className="text-lg font-semibold">
				<div className="flex flex-row items-center">{title}</div>
			</h1>
			{right}
		</header>
	);
};

export const ContentLayout = ({
	title,
	left,
	right,
	children,
	className,
}: {
	title: ReactNode;
	left?: ReactNode;
	right?: ReactNode;
	children: ReactNode;
	className?: string;
}) => {
	return (
		<div className="absolute inset-0 w-full">
			<div className="flex h-full flex-col">
				<Heading title={title} left={left} right={right} />
				<div className={`h-full flex-1 overflow-auto ${className || ""}`}>{children}</div>
			</div>
		</div>
	);
};
