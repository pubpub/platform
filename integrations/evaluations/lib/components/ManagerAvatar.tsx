import { Avatar, AvatarFallback } from "ui/avatar";

export function ManagerAvatar({ pub }: { pub: any }) {
	return (
		pub.claims.length > 0 && (
			<div>
				<div className="ml-4">
					{pub.claims.map((claim) => {
						const intials = claim.user.lastName
							? `${claim.user.firstName[0]} ${claim.user.lastName[0]}`
							: `${claim.user.firstName[0]}`;
						return (
							<div className="flex flex-row">
								<div>
									<Avatar>
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
