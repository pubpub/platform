import { forwardRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "ui/button";
import { X } from "ui/icon";

// Render children in a portal so they can safely use <form> components
export const PanelWrapper = ({
	children,
	sidebar,
}: {
	children: React.ReactNode;
	sidebar: Element | null;
}) => {
	if (!sidebar) {
		return null;
	}
	return createPortal(children, sidebar);
};

export const PanelHeader = ({
	title,
	showCancel,
	onCancel,
}: {
	title: string;
	showCancel: boolean;
	onCancel: () => void;
}) => {
	return (
		<>
			<div className="flex items-center justify-between">
				<div className="text-sm uppercase text-gray-500">{title}</div>
				{showCancel && (
					<Button
						aria-label="Cancel"
						variant="ghost"
						size="sm"
						className=""
						onClick={onCancel}
					>
						<X size={16} className="text-muted-foreground" />
					</Button>
				)}
			</div>
			<hr />
		</>
	);
};

export const SidePanel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ children, ...rest }, ref) => {
		return (
			<div
				{...rest}
				ref={ref}
				className="fixed right-0 top-[72px] z-10 flex h-[calc(100%-72px)] w-[380px] flex-col gap-10 overflow-auto border-l border-gray-200 bg-gray-50 p-4 pr-6 shadow"
			>
				{children}
			</div>
		);
	}
);
