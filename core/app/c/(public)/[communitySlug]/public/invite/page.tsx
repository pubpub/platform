import { RedirectHack } from "./StupidHackyThingy";

export default async function InvitePage({
	searchParams,
}: {
	searchParams: { redirectUrl: string };
}) {
	return (
		<div>
			<RedirectHack redirectUrl={searchParams.redirectUrl} />
		</div>
	);
}
