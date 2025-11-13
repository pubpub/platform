import { exportCommunity } from "~/prisma/seeds/jsonExport";

export default async function Page() {
	const exp = await exportCommunity();
	return (
		<div>
			<h1>Export</h1>
			<pre className="rounded-md bg-muted p-4 text-xs">{JSON.stringify(exp, null, 2)}</pre>
		</div>
	);
}
