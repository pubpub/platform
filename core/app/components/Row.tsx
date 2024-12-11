"use client";

import type { PropsWithChildren } from "react";

import { Card, CardContent, CardFooter, CardHeader } from "ui/card";
import { cn } from "utils";

type Props = PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>;

export const Row = ({ className, children, ...rest }: Props) => {
	return (
		<Card
			className={cn(
				"flex flex-col gap-2 border-b border-gray-200 bg-white px-4 py-3",
				className
			)}
			{...rest}
		>
			{children}
		</Card>
	);
};

export const RowHeader = (props: Props) => {
	return <CardHeader className={cn("p-0", props.className)}>{props.children}</CardHeader>;
};

export const RowContent = (props: Props) => {
	return <CardContent className={cn("p-0", props.className)}>{props.children}</CardContent>;
};

export const RowFooter = (props: Props) => {
	return <CardFooter className={cn("p-0", props.className)}>{props.children}</CardFooter>;
};
