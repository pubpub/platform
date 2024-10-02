"use client";

import React, { forwardRef } from "react";

import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "ui/dialog";

import { usePathAwareDialogSearchParam } from "~/lib/client/usePathAwareDialogSearchParam";

export type PathAwareDialogProps = {
	children: React.ReactNode;
	/**
	 * String that is necessary to identify this form from other froms,
	 * otherwise if multiple of the same button are rendered on the page
	 * multiple forms will	 be opened at the same time.
	 */
	id: string;
};

export const PathAwareDialog = forwardRef((props: PathAwareDialogProps, ref) => {
	const { isOpen, toggleDialog: toggleDialogue } = usePathAwareDialogSearchParam({
		id: props.id,
	});

	const [isReallyOpen, setIsReallyOpen] = React.useState(false);

	React.useEffect(() => {
		setIsReallyOpen(isOpen);
	}, [isOpen]);

	return (
		<Dialog onOpenChange={toggleDialogue} defaultOpen={false} open={isReallyOpen}>
			<DialogOverlay />
			{props.children}
		</Dialog>
	);
});

// 	const searchParams = useSearchParams();
// 	const pathname = usePathname();
// 	const router = useRouter();
// 	const isOpen = searchParams.get(props.param) === props.id;

// 	const close = useCallback(
// 		(open: boolean) => {
// 			const nextSearchParams = new URLSearchParams(searchParams);

// 			if (open) {
// 				nextSearchParams.set(props.param, props.id);
// 				router.push(`${pathname}?${nextSearchParams.toString()}`);
// 				return;
// 			}

// 			nextSearchParams.delete(props.param);
// 			router.push(`${pathname}?${nextSearchParams.toString()}`);
// 		},
// 		[pathname, router, searchParams]
// 	);

// 	const [isReallyOpen, setIsReallyOpen] = React.useState(false);
// 	useEffect(() => {
// 		setIsReallyOpen(isOpen);
// 	}, [isOpen]);

// 	return (
// 		<Dialog onOpenChange={close} defaultOpen={false} open={isReallyOpen}>
// 			<DialogOverlay />
// 			<DialogTrigger asChild>
// 				<Button
// 					variant={props.buttonVariant ?? "outline"}
// 					size={props.buttonSize ?? "sm"}
// 					className={cn("flex items-center gap-x-2 py-4", props.className)}
// 				>
// 					{props.icon}
// 					<span>{props.buttonText}</span>
// 				</Button>
// 			</DialogTrigger>
// 			<DialogContent className="max-h-full min-w-[32rem] max-w-fit overflow-auto">
// 				<DialogTitle>{props.title}</DialogTitle>
// 				{isOpen && <Suspense fallback={<SkeletonCard />}>{props.children}</Suspense>}
// 			</DialogContent>
// 		</Dialog>
// 	);
// });
