import type { ReactNode } from "react";

const Heading = ({
	title,
	action,
	editFormTitleButton,
}: {
	title: ReactNode;
	action: ReactNode;
	editFormTitleButton: ReactNode;
}) => {
	return (
		<header className="z-40 flex h-[72px] items-center justify-between border-b bg-gray-50 p-4 shadow-md">
			<h1 className="text-lg font-semibold">
				<div className="flex flex-row items-center">
					{title}
					{editFormTitleButton}
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
	editFormTitleButton,
}: {
	title: ReactNode;
	headingAction?: ReactNode;
	children: ReactNode;
	editFormTitleButton?: ReactNode;
}) => {
	return (
		<div className="absolute inset-0 w-full">
			<div className="flex h-full flex-col">
				<Heading
					title={title}
					action={headingAction}
					editFormTitleButton={editFormTitleButton}
				/>
				<div className="h-full flex-1 overflow-auto">{children}</div>
			</div>
		</div>
	);
};
