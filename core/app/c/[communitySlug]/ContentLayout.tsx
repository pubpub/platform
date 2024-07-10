import type { ReactNode } from "react";

const Heading = ({ children }: { children: ReactNode }) => {
	return (
		<header className="flex items-center justify-between border-b bg-gray-50 p-4 shadow-md">
			<h1 className="text-lg font-semibold">
				<div className="flex flex-row items-center">{children}</div>
			</h1>
		</header>
	);
};

const ContentLayout = ({ heading, children }: { heading: ReactNode; children: ReactNode }) => {
	return (
		<div className="absolute inset-0 w-full">
			<div className="flex h-full flex-col">
				<Heading>{heading}</Heading>
				<div className="h-full flex-1 overflow-auto">{children}</div>
			</div>
		</div>
	);
};

export default ContentLayout;
