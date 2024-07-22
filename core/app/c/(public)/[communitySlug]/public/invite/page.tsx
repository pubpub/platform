import { Loader2 } from "ui/icon";

import { RedirectAfterSupabaseAuth } from "./RedirectHack";

/**
 * This page exists to redirect after supase has singed in a user
 */
export default async function InvitePage({
	searchParams,
}: {
	searchParams: { redirectTo: string };
}) {
	return (
		<>
			<RedirectAfterSupabaseAuth redirectTo={searchParams.redirectTo} />
			<div className="container mx-auto flex w-full flex-col items-center">
				<div className="flex flex-col gap-y-4">
					<p> You are being redirected </p>
					<Loader2 className="animate-spin" />
				</div>
			</div>
		</>
	);
}
