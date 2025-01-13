import type { ReactNode } from "react"

const Heading = ({
	title,
	left,
	right,
}: {
	title: ReactNode
	left?: ReactNode
	right?: ReactNode
}) => {
	return (
		<header className="z-40 flex h-[72px] items-center justify-between border-b bg-gray-50 p-4 shadow-md">
			{left}
			<h1 className="text-lg font-semibold">
				<div className="flex flex-row items-center">{title}</div>
			</h1>
			{right}
		</header>
	)
}

export const ContentLayout = ({
	title,
	left,
	right,
	children,
}: {
	title: ReactNode
	left?: ReactNode
	right?: ReactNode
	children: ReactNode
}) => {
	return (
		<div className="absolute inset-0 w-full">
			<div className="flex h-full flex-col">
				<Heading title={title} left={left} right={right} />
				<div className="h-full flex-1 overflow-auto">{children}</div>
			</div>
		</div>
	)
}
