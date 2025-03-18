import type { CommunitiesId, UsersId } from "db/public";
import {
	Action,
	CoreSchemaType,
	ElementType,
	InputComponent,
	MemberRole,
	StructuralFormElement,
} from "db/public";

import { env } from "~/lib/env/env.mjs";
import { seedCommunity } from "../seedCommunity";

export async function seedArcadiaJournal(communityId?: CommunitiesId) {
	const memberId = crypto.randomUUID() as UsersId;

	return seedCommunity(
		{
			community: {
				id: communityId,
				name: "Arcadia Journal",
				slug: "arcadia-journal",
				avatar: env.PUBPUB_URL + "/demo/croc.png",
			},
			pubFields: {
				/* Pub */
				Title: { schemaName: CoreSchemaType.String },
				"Airtable ID": { schemaName: CoreSchemaType.String },
				"Author Email": { schemaName: CoreSchemaType.Email },
				Content: { schemaName: CoreSchemaType.String },
				"DOI URL": { schemaName: CoreSchemaType.URL },
				Description: { schemaName: CoreSchemaType.String },
				Discussions: { schemaName: CoreSchemaType.Null, relation: true },
				"Google Drive Folder Url": { schemaName: CoreSchemaType.URL },
				"Hide Discussions": { schemaName: CoreSchemaType.Boolean },
				"Hide Feedback Form": { schemaName: CoreSchemaType.Boolean },
				"Hide Share Thoughts": { schemaName: CoreSchemaType.Boolean },
				"Icing Hashtags": { schemaName: CoreSchemaType.StringArray },
				"Last Published": { schemaName: CoreSchemaType.DateTime },
				Narratives: { schemaName: CoreSchemaType.Null, relation: true },
				"Pub URL": { schemaName: CoreSchemaType.URL },
				"Pub Contributors": { schemaName: CoreSchemaType.Null, relation: true },
				"Publication Date": { schemaName: CoreSchemaType.DateTime },
				"Social Count": { schemaName: CoreSchemaType.Number },
				"Twitter Collection URL": { schemaName: CoreSchemaType.URL },
				"Typeform URL": { schemaName: CoreSchemaType.URL },
				Versions: { schemaName: CoreSchemaType.Null, relation: true },
				Slug: { schemaName: CoreSchemaType.String },
				"temp drive folder url": { schemaName: CoreSchemaType.URL },
				/* Contributor */
				"Full Name": { schemaName: CoreSchemaType.String },
				"Contributor Person": { schemaName: CoreSchemaType.Null, relation: true },
				Affiliations: { schemaName: CoreSchemaType.Null, relation: true },
				Roles: { schemaName: CoreSchemaType.Null, relation: true },
				/* Person */
				ORCiD: { schemaName: CoreSchemaType.URL },
				Avatar: { schemaName: CoreSchemaType.URL },
				"Avatar File": { schemaName: CoreSchemaType.FileUpload },
				/* Discussion */
				Anchor: { schemaName: CoreSchemaType.String },
				"Is Closed": { schemaName: CoreSchemaType.Boolean },
				"Parent ID": { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				Pub: {
					Title: { isTitle: true },
					"Airtable ID": { isTitle: false },
					"Author Email": { isTitle: false },
					Content: { isTitle: false },
					"DOI URL": { isTitle: false },
					Description: { isTitle: false },
					Discussions: { isTitle: false },
					"Google Drive Folder Url": { isTitle: false },
					"Hide Discussions": { isTitle: false },
					"Hide Feedback Form": { isTitle: false },
					"Hide Share Thoughts": { isTitle: false },
					"Icing Hashtags": { isTitle: false },
					"Last Published": { isTitle: false },
					Narratives: { isTitle: false },
					"Pub Contributors": { isTitle: false },
					"Pub URL": { isTitle: false },
					"Publication Date": { isTitle: false },
					"Social Count": { isTitle: false },
					"Twitter Collection URL": { isTitle: false },
					"Typeform URL": { isTitle: false },
					Versions: { isTitle: false },
					Slug: { isTitle: false },
					"temp drive folder url": { isTitle: false },
				},
				Contributor: {
					"Full Name": { isTitle: true },
					"Contributor Person": { isTitle: false },
					Affiliations: { isTitle: false },
					"Airtable ID": { isTitle: false },
					Roles: { isTitle: false },
				},
				Person: {
					"Full Name": { isTitle: true },
					"Airtable ID": { isTitle: false },
					"Avatar File": { isTitle: false },
					ORCiD: { isTitle: false },
					Avatar: { isTitle: false },
				},
				Type: {
					Title: { isTitle: true },
					"Airtable ID": { isTitle: false },
					Slug: { isTitle: false },
				},
				Narrative: {
					Title: { isTitle: true },
					"Airtable ID": { isTitle: false },
					"Google Drive Folder Url": { isTitle: false },
					"Icing Hashtags": { isTitle: false },
					"Publication Date": { isTitle: false },
					Slug: { isTitle: false },
				},
				Roles: {
					Title: { isTitle: true },
					"Airtable ID": { isTitle: false },
				},
				Institutions: {
					Title: { isTitle: true },
					"Airtable ID": { isTitle: false },
				},
				Version: {
					Description: { isTitle: true },
					Content: { isTitle: false },
					"Publication Date": { isTitle: false },
				},
				Discussion: {
					"Full Name": { isTitle: true },
					Anchor: { isTitle: false },
					"Author Email": { isTitle: false },
					Content: { isTitle: false },
					"Is Closed": { isTitle: false },
					ORCiD: { isTitle: false },
					"Parent ID": { isTitle: false },
					"Publication Date": { isTitle: false },
					Avatar: { isTitle: false },
				},
			},
			users: {
				new: {
					id: memberId,
					firstName: "Arcadia",
					email: "arcadia-journal@pubpub.org",
					lastName: "Journal",
					password: "pubpub-arcadia-journal",
					role: MemberRole.admin,
				},
				hih: {
					role: MemberRole.contributor,
				},
			},
			pubs: [
				{
					assignee: "new",
					pubType: "Pub",
					values: {
						Title: "Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present",
						Content: "New Pub 1 Content",
						"Author Email": "new@pubpub.org",
						"Pub URL": "https://pubpub.org",
					},
					stage: "Submitted",
				},
			],
			forms: {
				Review: {
					pubType: "Pub",
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
								label: "Title",
								maxLength: 255,
								help: "Give your review a snazzy title.",
							},
						},
						{
							field: "Content",
							type: ElementType.pubfield,
							component: InputComponent.textArea,
							config: {
								label: "Content",
								help: "Enter your review here",
								minLength: 255,
							},
						},
					],
				},
			},
			stages: {
				Submitted: {
					members: { new: MemberRole.contributor },
					actions: {
						"Send Review email": {
							action: Action.email,
							config: {
								subject: "HELLO :recipientName REVIEW OUR STUFF PLEASE",
								recipient: memberId,
								body: `You are invited to fill in a form.\n\n\n\n:link{form="review"}\n\nCurrent time: :value{field='croccroc:published-at'}`,
							},
							name: "Send Review email",
						},
					},
				},
				"Ask Author for Consent": {
					members: { new: MemberRole.contributor },
				},
				"To Evaluate": {
					members: { new: MemberRole.contributor },
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
			withApiToken: "11111111-1111-1111-1111-111111111111.yyyyyyyyyyyyyyyz",
		}
	);
}
