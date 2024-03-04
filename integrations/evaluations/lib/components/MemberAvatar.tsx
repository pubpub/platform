import { Avatar, AvatarFallback } from "ui/avatar";

export function ManagerAvatar({ pub }: { pub: any }) {
	return (
		pub.claims.length > 0 && (
			<div>
				<div>
					{pub.claims.map((claim) => {
						const intials = claim.user.lastName
							? `${claim.user.firstName[0]} ${claim.user.lastName[0]}`
							: `${claim.user.firstName[0]}`;
						return (
							<div className="flex flex-row p-1">
								<div className="mr-4">
									<Avatar className="rounded w-9 h-9 mr-2">
										<AvatarFallback>{intials}</AvatarFallback>
									</Avatar>
								</div>
								<p className="font-medium" key={claim.id}>
									{claim.user.firstName} {claim.user.lastName}{" "}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		)
	);
}
