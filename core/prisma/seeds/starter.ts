import { faker } from "@faker-js/faker";
import { defaultMarkdownParser } from "prosemirror-markdown";

import type { CommunitiesId, UsersId } from "db/public";
import {
	Action,
	CoreSchemaType,
	ElementType,
	FormAccessType,
	InputComponent,
	MemberRole,
	StructuralFormElement,
} from "db/public";

import { env } from "~/lib/env/env";
import { seedCommunity } from "../seed/seedCommunity";

export async function seedStarter(communityId?: CommunitiesId) {
	const memberId = crypto.randomUUID() as UsersId;

	return seedCommunity(
		{
			community: {
				id: communityId,
				name: "Starter",
				slug: "starter",
				avatar: env.PUBPUB_URL + "/demo/croc.png",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Content: { schemaName: CoreSchemaType.RichText },
				Email: { schemaName: CoreSchemaType.Email },
				URL: { schemaName: CoreSchemaType.URL },
				MemberID: { schemaName: CoreSchemaType.MemberId },
				"ok?": { schemaName: CoreSchemaType.Boolean },
				File: { schemaName: CoreSchemaType.FileUpload },
				Confidence: { schemaName: CoreSchemaType.Vector3 },
				"Published At": { schemaName: CoreSchemaType.DateTime },
				"File Upload": { schemaName: CoreSchemaType.FileUpload },
				Evaluations: { schemaName: CoreSchemaType.Null, relation: true },
			},
			pubTypes: {
				Article: {
					Title: { isTitle: true },
					Content: { isTitle: false },
					Email: { isTitle: false },
					URL: { isTitle: false },
					MemberID: { isTitle: false },
					"ok?": { isTitle: false },
					File: { isTitle: false },
					Confidence: { isTitle: false },
					"Published At": { isTitle: false },
					"File Upload": { isTitle: false },
					Evaluations: { isTitle: false },
				},
				Evaluation: {
					Title: { isTitle: true },
					Content: { isTitle: false },
					Email: { isTitle: false },
					URL: { isTitle: false },
					MemberID: { isTitle: false },
					"ok?": { isTitle: false },
					File: { isTitle: false },
					Confidence: { isTitle: false },
					"Published At": { isTitle: false },
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
					pubType: "Article",
					values: {
						Title: "Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present",
						Content: defaultMarkdownParser.parse(faker.lorem.paragraph(1)).toJSON(),
						Email: "new@pubpub.org",
						URL: "https://pubpub.org",
						MemberID: memberId,
						"ok?": true,
						Confidence: [0, 0, 0],
						"Published At": new Date(),
					},
					relatedPubs: {
						Evaluations: [
							{
								value: null,
								pub: {
									pubType: "Evaluation",
									values: {
										Title: "Evaluation of Ancient Giants",
										"Published At": new Date(),
									},
								},
							},
						],
					},
					stage: "Draft",
				},
			],
			forms: {
				Review: {
					access: FormAccessType.public,
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
								label: "Title",
								maxLength: 255,
								help: "Give your review a snazzy title.",
							},
						},
						{
							field: "Content",
							type: ElementType.pubfield,
							component: InputComponent.richText,
							config: {
								label: "Content",
								help: "Enter your review here",
								minLength: 255,
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
						{
							type: ElementType.button,
							content: `Go see your pubs :link{page='currentPub' text='here'}`,
							label: "Submit",
							stage: "Draft",
						},
					],
				},
			},
			stages: {
				Draft: {
					members: { new: MemberRole.contributor },
					actions: {
						"Send Review email": {
							action: Action.email,
							config: {
								subject: "Hello, :recipientName! Please review this draft!",
								recipient: memberId,
								body: `You are invited to fill in a form.\n\n\n\n:link{form="review"}\n\nCurrent time: :value{field='starter:published-at'}`,
							},
						},

						"Send Other Review email": {
							action: Action.email,
							config: {
								subject: "Hello Please review this draft!",
								recipient: "yo@pubpub.org",
								body: `You are invited to fill in a form.\n\n\n\n:link{form="review"}\n\nCurrent time: :value{field='starter:published-at'}`,
							},
						},
					},
				},
				Published: {
					members: { new: MemberRole.contributor },
				},
			},
			apiTokens: {
				allToken: {
					id: "11111111-1111-1111-1111-111111111111.yyyyyyyyyyyyyyyy",
				},
			},
		},
		{
			// this makes sure that the slug is `starter`, not `starter-${new Date().toISOString()}
			randomSlug: false,
		}
	);
}
