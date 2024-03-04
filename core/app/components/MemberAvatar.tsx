import { Avatar, AvatarFallback } from "ui/avatar";
import { PubPayload } from "~/lib/types";

function MembersAvatars({ pub }: { pub: PubPayload }) {
	return (
		pub.claims.length > 0 && (
			<div>
				<p className="font-bold pb-1">Assigned to:</p>
				<div className="ml-4">
					{pub.claims.map((claim) => {
						const intials = claim.user.lastName
							? `${claim.user.firstName[0]} ${claim.user.lastName[0]}`
							: `${claim.user.firstName[0]}`;
						return (
							<div className="flex flex-row p-1">
								<div className="mr-4">
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
export default MembersAvatars;
