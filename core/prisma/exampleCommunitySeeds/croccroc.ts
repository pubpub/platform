import type { CommunitiesId, UsersId } from "db/public";
import {
	Action,
	CoreSchemaType,
	ElementType,
	Event,
	InputComponent,
	MemberRole,
	StructuralFormElement,
} from "db/public";

import { env } from "~/lib/env/env.mjs";
import { seedCommunity } from "../seed/seedCommunity";

export async function seedCroccroc(communityId?: CommunitiesId) {
	const memberId = crypto.randomUUID() as UsersId;

	return seedCommunity(
		{
			community: {
				id: communityId,
				name: "CrocCroc",
				slug: "croccroc",
				avatar: env.PUBPUB_URL + "/demo/croc.png",
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
				"Published At": { schemaName: CoreSchemaType.DateTime },
				"File Upload": { schemaName: CoreSchemaType.FileUpload },
				Evaluations: { schemaName: CoreSchemaType.Null, relation: true },
			},
			pubTypes: {
				Submission: {
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
					assignee: "new",
					pubType: "Submission",
					values: {
						Title: "Ancient Giants: Unpacking the Evolutionary History of Crocodiles from Prehistoric to Present",
						Content: "New Pub 1 Content",
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
					stage: "Submitted",
				},
				{
					pubType: "Submission",
					values: {
						Title: "Rule Test",
						Content: "Rule Test Content",
						"Published At": new Date(),
					},
					stage: "Rule Test",
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
					members: { new: MemberRole.contributor },
					actions: {
						"Log Review": {
							action: Action.log,
							config: {},
						},
						"Send Review email": {
							action: Action.email,
							config: {
								subject: "HELLO :recipientName REVIEW OUR STUFF PLEASE",
								recipient: memberId,
								body: `You are invited to fill in a form.\n\n\n\n:link{form="review"}\n\nCurrent time: :value{field='croccroc:published-at'}`,
							},
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
				"Rule Test": {
					actions: {
						"Log 1": {
							action: Action.log,
							config: {},
						},
						"Log 2": {
							action: Action.log,
							config: {},
						},
						"Log 3": {
							action: Action.log,
							config: {},
						},
						"Log 4": {
							action: Action.log,
							config: {},
						},
						"Log 5": {
							action: Action.log,
							config: {},
						},
						"Log 6": {
							action: Action.log,
							config: {},
						},
						"Log 7": {
							action: Action.log,
							config: {},
						},
						"Log 8": {
							action: Action.log,
							config: {},
						},
						"Log 9": {
							action: Action.log,
							config: {},
						},

						"Email 1": {
							action: Action.email,
							config: {
								body: "test",
								subject: "Hello",
							},
						},
						"Log X": {
							action: Action.log,
							config: {},
						},
					},
					rules: [
						{
							actionInstance: "Log 1",
							event: Event.actionSucceeded,
							watchedAction: "Log 2",
						},
						{
							actionInstance: "Log 2",
							event: Event.actionSucceeded,
							watchedAction: "Log 3",
						},
						{
							actionInstance: "Log 3",
							event: Event.actionSucceeded,
							watchedAction: "Log 4",
						},
						{
							actionInstance: "Log 4",
							event: Event.actionSucceeded,
							watchedAction: "Log 5",
						},
						{
							actionInstance: "Log 5",
							event: Event.actionSucceeded,
							watchedAction: "Log 6",
						},
						{
							actionInstance: "Log 6",
							event: Event.actionSucceeded,
							watchedAction: "Log 7",
						},
						{
							actionInstance: "Log 7",
							event: Event.actionSucceeded,
							watchedAction: "Log 8",
						},
						{
							actionInstance: "Log 8",
							event: Event.actionSucceeded,
							watchedAction: "Log 9",
						},
						{
							actionInstance: "Log 1",
							event: Event.actionFailed,
							watchedAction: "Email 1",
						},
					],
				},
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
			withApiToken: "11111111-1111-1111-1111-111111111111.yyyyyyyyyyyyyyyy",
		}
	);
}
