"use client";

import type { ReactNode } from "react";

import { Button } from "ui/button";

const Heading = ({ title, action }: { title: ReactNode; action: ReactNode }) => {
	return (
		<header className="z-40 flex h-[72px] items-center justify-between border-b bg-gray-50 p-4 shadow-md">
			<h1 className="text-lg font-semibold">
				<div className="flex flex-row items-center">
					{title}
					<Button
						variant="ghost"
						className="ml-2 text-sm text-gray-500 hover:text-blue-600 hover:underline"
					>
						Edit
					</Button>
				</div>
			</h1>
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
