import { PropsWithChildren } from "react";
import { Card, CardContent, CardFooter } from "ui";
import { cn } from "utils";

type Props = PropsWithChildren<{ className?: string }>;

export const Row = (props: Props) => {
	return (
		<Card
			className={cn(
				"flex flex-col gap-1 px-4 py-3 bg-white border-b border-gray-200",
				props.className
			)}
		>
			{props.children}
		</Card>
	);
};

export const RowContent = (props: Props) => {
	return <CardContent className={cn("p-0", props.className)}>{props.children}</CardContent>;
};

export const RowFooter = (props: Props) => {
	return <CardFooter className={cn("p-0", props.className)}>{props.children}</CardFooter>;
};
