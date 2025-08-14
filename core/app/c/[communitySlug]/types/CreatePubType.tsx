"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { PubTypesId } from "db/public";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "ui/dialog";
import { Plus } from "ui/icon";
import { cn } from "utils";

import { Footer } from "~/app/components/CreateEditDialog";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { SkeletonCard } from "~/app/components/skeletons/SkeletonCard";
import { NewTypeForm } from "./NewTypeForm";
import { TypeEditor } from "./TypeEditor";

export const CreatePubTypeButton = ({ className }: { className?: string }) => {
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();
	const community = useCommunity();

	const onSuccess = useCallback((pubTypeId: PubTypesId) => {
		setIsOpen(false);
		router.push(`/c/${community.slug}/types/${pubTypeId}/edit`);
	}, []);

	return (
		<Dialog onOpenChange={setIsOpen} defaultOpen={false} open={isOpen}>
			<DialogOverlay />
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn(
						"flex items-center gap-x-2 bg-emerald-500 py-4 text-white",
						className
					)}
				>
					<Plus size="12" className="mb-0.5" />
					Create Type
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-full min-w-[32rem] max-w-fit overflow-auto">
				<DialogTitle>Create Type</DialogTitle>

				{isOpen && (
					<NewTypeForm onSubmitSuccess={onSuccess}>
						<Footer submitText="Create" onCancel={() => setIsOpen(false)} />
					</NewTypeForm>
				)}
			</DialogContent>
		</Dialog>
	);
};
