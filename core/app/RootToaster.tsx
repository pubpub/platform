"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";

import { Toaster } from "ui/toaster";
import { toast } from "ui/use-toast";

const VERIFIED_PARAM = "verified";

export const RootToaster = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	useEffect(() => {
		if (searchParams.has(VERIFIED_PARAM)) {
			toast({
				title: "Verified",
				description: (
					<span className="flex items-center gap-1">
						<CircleCheck size="16" /> Your email is now verified
					</span>
				),
				variant: "success",
			});

			// Remove the param so we don't see the popover again
			const params = new URLSearchParams(searchParams);
			params.delete(VERIFIED_PARAM);
			router.replace(`${pathname}?${params.toString()}`);
		}
	}, [searchParams]);

	return <Toaster />;
};
