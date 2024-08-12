import type { ReactNode } from "react";

import { Button } from "ui/button";
import { Bookmark } from "ui/icon";

import Logo from "~/app/components/Logo";
import { HEADER_HEIGHT } from "~/lib/ui";

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
					<Bookmark size={16} className="mr-2" strokeWidth={1} /> Bookmark
				</Button>
			</div>
		</div>
	);
};
