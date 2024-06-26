import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "ui/accordion";
import { Button } from "ui/button";
import { Card } from "ui/card";
import { Trash } from "ui/icon";

import type { FullApiAccessToken } from "~/lib/server/apiAccessTokens";

export const ExistingToken = ({ token }: { token: FullApiAccessToken }) => {
	return (
		<Card className="p-4">
			<div className="grid grid-cols-[1fr_auto] gap-4">
				<div>
					<h3 className="text-base font-semibold">{token.name}</h3>
					{token.description && (
						<p className="text-sm text-muted-foreground">{token.description}</p>
					)}
				</div>
				<div className="flex items-center justify-end">
					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground hover:text-destructive"
					>
						<Trash className="h-5 w-5" />
						<span className="sr-only">Revoke token</span>
					</Button>
				</div>
			</div>
			<div className="mt-4 flex flex-col gap-4">
				<div className="flex items-center justify-between gap-2">
					<div>
						<p className="text-xs text-muted-foreground">Created on</p>
						<p className="text-sm">{token.issuedAt.toLocaleDateString()}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Expires on</p>
						<p className="text-sm"> {token.expiration.toLocaleDateString()}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Issued by</p>
						{token.issuedBy ? (
							<p className="text-sm">
								{token.issuedBy.firstName} {token.issuedBy.lastName}
							</p>
						) : (
							<p>User account associated with this token has been deleted</p>
						)}
					</div>
				</div>
				<div>
					<Accordion type="single" collapsible>
						<AccordionItem value="permissions" className="border-b-0">
							<AccordionTrigger className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
								Permissions
							</AccordionTrigger>
							<AccordionContent>
								<p>
									{token.permissions
										?.map(
											(permission) =>
												`${permission.scope}: ${permission.accessType} ${permission.constraints ? JSON.stringify(permission.constraints) : ""}`
										)
										.join(", ")}
								</p>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</Card>
	);
};
