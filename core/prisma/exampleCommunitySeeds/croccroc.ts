import type { CommunitiesId, UsersId } from "db/public";
import {
	Action,
	CoreSchemaType,
	ElementType,
	InputComponent,
	MemberRole,
	StructuralFormElement,
} from "db/public";

import { seedCommunity } from "../seed/seedCommunity";

export async function seedCroccroc(communityId?: CommunitiesId) {
	const memberId = crypto.randomUUID() as UsersId;

	return seedCommunity(
		{
			community: {
				id: communityId,
				name: "CrocCroc",
				slug: "croccroc",
				avatar: "/demo/croc.png",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Content: { schemaName: CoreSchemaType.String },
				Email: { schemaName: CoreSchemaType.Email },
				URL: { schemaName: CoreSchemaType.URL },
				MemberID: { schemaName: CoreSchemaType.MemberId },
				"ok?": { schemaName: CoreSchemaType.Boolean },
				File: { schemaName: CoreSchemaType.FileUpload },
				Confidence: { schemaName: CoreSchemaType.Vector3 },
			},
			pubTypes: {
				Submission: {
					Title: true,
					Content: true,
					Email: true,
					URL: true,
					MemberID: true,
					"ok?": true,
					File: true,
					Confidence: true,
				},
				Evaluation: {
					Title: true,
					Content: true,
					Email: true,
					URL: true,
					MemberID: true,
					"ok?": true,
					File: true,
					Confidence: true,
				},
			},
			users: {
				new: {
					id: memberId,
					firstName: "Croc",
					email: "new@pubpub.org",
					lastName: "Croc",
					password: "pubpub-new",
					role: MemberRole.admin,
				},
				hih: {
					role: MemberRole.contributor,
				},
			},
			pubs: [
				{
					assignee: "new",
					pubType: "Submission",
					values: {
						Title: "Evaluation of Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present",
						Content: "New Pub 1 Content",
						Email: "new@pubpub.org",
						URL: "https://pubpub.org",
						MemberID: memberId,
						"ok?": true,
						Confidence: [0, 0, 0],
					},
					children: [
						{
							pubType: "Evaluation",
							values: {
								Title: "Evaluation of Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present",
							},
						},
					],
					stage: "Submitted",
				},
			],
			forms: {
				Review: {
					pubType: "Evaluation",
					elements: [
						{
							type: ElementType.structural,
							element: StructuralFormElement.p,
							content: `# Review\n\n Thank you for agreeing to review this Pub, please do not be a meany bobeeny.`,
						},
						{
							field: "Title",
							type: ElementType.pubfield,
							component: InputComponent.textInput,
							config: {
								maxLength: 255,
								label: "Title",
								help: "Give your review a snazzy title.",
							},
						},
						{
							field: "Content",
							type: ElementType.pubfield,
							component: InputComponent.textArea,
							config: {
								help: "Enter your review here",
								minLength: 255,
								label: "Content",
							},
						},
						{
							field: "File",
							type: ElementType.pubfield,
							component: InputComponent.fileUpload,
							config: {
								label: "Attachment",
								help: "Please attach the file for your review here.",
							},
						},
					],
				},
			},
			stages: {
				Submitted: {
					members: ["new"],
					actions: [
						{
							action: Action.email,
							config: {
								subject: "HELLO :recipientName REVIEW OUR STUFF PLEASE",
								recipient: memberId,
								body: `You are invited to fill in a form.\n\n\n\n:link{form="review"}`,
							},
							name: "Send Review email",
						},
					],
				},
				"Ask Author for Consent": {
					members: ["new"],
				},
				"To Evaluate": {
					members: ["new"],
				},
				"Under Evaluation": {},
				"In Production": {},
				Published: {},
				Shelved: {},
			},
			stageConnections: {
				Submitted: {
					to: ["To Evaluate"],
				},
				"To Evaluate": {
					to: ["Under Evaluation"],
				},
				"Under Evaluation": {
					to: ["Ask Author for Consent"],
				},
				"Ask Author for Consent": {
					to: ["In Production"],
				},
				"In Production": {
					to: ["Published"],
				},
			},
		},
		{
			// this makes sure that the slug is `croccroc`, not `croccroc-${new Date().toISOString()}
			randomSlug: false,
		}
	);
}
