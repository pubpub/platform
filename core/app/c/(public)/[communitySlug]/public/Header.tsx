import type { ReactNode } from "react";

import dynamic from "next/dynamic";

import { Button } from "ui/button";

import Logo from "~/app/components/Logo";
import { HEADER_HEIGHT } from "~/lib/ui";

const CopyCurrentUrlButton = dynamic(
	() =>
		import("~/app/components/CopyCurrentUrlButton").then(
			(module) => module.CopyCurrentUrlButton
		),
	{
		ssr: false,
	}
);

export const Header = ({ children }: { children: ReactNode }) => {
	return (
		<div
			className="border-color-gray-100 sticky top-0 z-10 flex items-center gap-2 border-b bg-gray-50 py-5"
			style={{ height: `${HEADER_HEIGHT}px` }}
		>
			<div className="ml-4 flex-1">
				<Logo className="text-[#C1C8CD]" width={32} height={32} />
			</div>
			{children}
			<div className="mr-6 flex flex-1 justify-end">
				<Button variant="outline" className="border-foreground">
					<CopyCurrentUrlButton className="flex h-8 w-auto gap-1 p-3">
						Copy link
					</CopyCurrentUrlButton>
				</Button>
			</div>
		</div>
	);
};
