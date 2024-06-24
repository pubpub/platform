"use client";

import { Suspense, useState } from "react";

import { Button } from "ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "ui/dialog";
import { Plus } from "ui/icon";

import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { TypeEditor } from "./TypeEditor";

export const CreatePubType = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} defaultOpen={false} open={isOpen}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="flex items-center gap-x-2 py-4">
					<Plus size="12" className="mb-0.5" />
					Create Type
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-[32rem] max-w-fit overflow-auto">
				<DialogTitle>Create Type</DialogTitle>

				{isOpen && (
					<Suspense fallback={<SkeletonCard />}>
						<TypeEditor onTypeCreation={() => setIsOpen(false)} />
					</Suspense>
				)}
			</DialogContent>
		</Dialog>
	);
};
