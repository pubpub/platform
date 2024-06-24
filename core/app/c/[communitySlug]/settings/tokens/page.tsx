// export default async function TokensPage({ params }: { params: { communitySlug: string } }) {
// 	const { communitySlug } = params;
// 	return (
// 		<main className="flex flex-col items-start gap-y-4">
// 		</main>
// 	);
// }

/**
 * v0 by Vercel.
 * @see https://v0.dev/t/oRcKo4dpMnT
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Checkbox } from "ui/checkbox";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Textarea } from "ui/textarea";

import { CreateTokenForm } from "./CreateTokenForm";

export default async function Page() {
	return (
		<div className="container mx-auto px-4 py-12 md:px-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Access Tokens</h1>
					<p className="text-muted-foreground">
						Manage granular access tokens for your application. Create, revoke, and
						monitor token usage.
					</p>
				</div>
				<div className="grid gap-6">
					<div className="grid gap-2">
						<h2 className="text-xl font-semibold">Existing Tokens</h2>
						<div className="grid gap-4 overflow-auto">
							<Card className="p-4">
								<div className="grid grid-cols-[1fr_auto] gap-4">
									<div>
										<h3 className="text-base font-semibold">Admin Token</h3>
										<p className="text-sm text-muted-foreground">
											Full access to all features
										</p>
									</div>
									<div className="flex items-center justify-end">
										<Button
											variant="ghost"
											size="icon"
											className="text-muted-foreground hover:text-destructive"
										>
											<TrashIcon className="h-5 w-5" />
											<span className="sr-only">Revoke token</span>
										</Button>
									</div>
								</div>
								<div className="mt-4 grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Created on</p>
										<p>June 1, 2023</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Expires on</p>
										<p>June 1, 2024</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Permissions</p>
										<p>Read, Write, Admin</p>
									</div>
								</div>
							</Card>
							<Card className="p-4">
								<div className="grid grid-cols-[1fr_auto] gap-4">
									<div>
										<h3 className="text-base font-semibold">Read-Only Token</h3>
										<p className="text-sm text-muted-foreground">
											Read-only access to user data
										</p>
									</div>
									<div className="flex items-center justify-end">
										<Button
											variant="ghost"
											size="icon"
											className="text-muted-foreground hover:text-destructive"
										>
											<TrashIcon className="h-5 w-5" />
											<span className="sr-only">Revoke token</span>
										</Button>
									</div>
								</div>
								<div className="mt-4 grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Created on</p>
										<p>May 15, 2023</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Expires on</p>
										<p>May 15, 2024</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Permissions</p>
										<p>Read</p>
									</div>
								</div>
							</Card>
						</div>
					</div>
					<CreateTokenForm />
				</div>
			</div>
		</div>
	);
}

function TrashIcon(props) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M3 6h18" />
			<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
			<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
		</svg>
	);
}
