import type { ReactNode } from "react";

import { SidebarTrigger } from "ui/sidebar";

import { HEADER_HEIGHT } from "~/lib/ui";
import { COLLAPSIBLE_TYPE } from "./layout";

const Heading = ({ title, action }: { title: ReactNode; action: ReactNode }) => {
	return (
		<header
			className={`flex h-[${HEADER_HEIGHT}px] items-center justify-between border-b bg-gray-50 p-4 shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
		>
			<div className="flex items-center">
				{COLLAPSIBLE_TYPE === "icon" ? null : <SidebarTrigger />}
				<h1 className="text-lg font-semibold">
					<div className="flex flex-row items-center">{title}</div>
				</h1>
			</div>
			{action}
		</header>
	);
};

export const ContentLayout = ({
	title,
	headingAction,
	children,
}: {
	title: ReactNode;
	headingAction?: ReactNode;
	children: ReactNode;
}) => {
	return (
		<div className="absolute inset-0 w-full">
			<div className="flex h-full flex-col">
				<Heading title={title} action={headingAction} />
				<div className="h-full flex-1 overflow-auto">{children}</div>
			</div>
		</div>
	);
};
