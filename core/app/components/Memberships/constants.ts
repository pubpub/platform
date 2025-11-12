import { MembershipType } from "db/public";

export const descriptions: Record<MembershipType, string> = {
	[MembershipType.pub]:
		"Select the forms via which this member can edit and view this Pub. If no form is selected, they will only be able to view the Pub, and will only see fields added to the default Pub form for this type.",
	[MembershipType.stage]:
		"Select the forms via which this member can edit and view Pubs in this stage. If no form is selected, they will only be able to view Pubs in this stage, and will only see fields added to the default Pub form for a each Pub type.",
	[MembershipType.community]:
		"Selecting forms will give the member the ability to create Pubs in the community using the selected forms. If no forms are added, the contributor will not be able to create any Pubs, and will only be able to see Pubs they have access to either directly or at the stage level.",
};
