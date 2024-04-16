import { Avatar, AvatarFallback } from "ui/avatar";

import { PubPayload } from "~/lib/types";

function MembersAvatars({ pub }: { pub: PubPayload }) {
	return (
		pub.claims.length > 0 && (
			<>
				<p className="pb-1 font-bold">Assigned to:</p>
				<div className="ml-4">
					{pub.claims.map((claim) => {
						const intials = claim.user.lastName
							? `${claim.user.firstName[0]} ${claim.user.lastName[0]}`
							: `${claim.user.firstName[0]}`;
						return (
							<div key={claim.id} className="flex flex-row items-center space-x-3">
								<Avatar>
									<AvatarFallback>{intials}</AvatarFallback>
								</Avatar>
								<p className="font-medium" key={claim.id}>
									{claim.user.firstName} {claim.user.lastName}{" "}
								</p>
							</div>
						);
					})}
				</div>
			</>
		)
	);
}
export default MembersAvatars;
