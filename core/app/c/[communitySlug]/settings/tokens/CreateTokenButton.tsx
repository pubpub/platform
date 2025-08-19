"use client";

import type { PropsWithChildren } from "react";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
	DialogTrigger,
} from "ui/dialog";
import { cn } from "utils";

import { useCommunity } from "~/app/components/providers/CommunityProvider";

export type CreateTokenButtonProps = {
	className?: string;
};
export const CreateTokenButton = ({
	className,
	children,
}: PropsWithChildren<CreateTokenButtonProps>) => {
	const community = useCommunity();

	return (
		<Dialog defaultOpen={false}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button className={cn("h-10 bg-emerald-500 text-white", className)}>
					<Plus size={16} /> New Token
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-[20rem] max-w-fit overflow-auto md:min-w-[32rem]">
				<DialogHeader>
					<DialogTitle>New API Token</DialogTitle>
					<DialogDescription>
						Create a new API token to access the{" "}
						<Link href={`/c/${community.slug}/developers/docs`}>API</Link>.
					</DialogDescription>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
};
