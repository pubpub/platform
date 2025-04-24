import crypto from "crypto";

import { faker } from "@faker-js/faker";

import type { PubsId, UsersId } from "db/public";
import {
	Action,
	CoreSchemaType,
	ElementType,
	InputComponent,
	InviteStatus,
	MemberRole,
} from "db/public";
import { logger } from "logger";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";

const ACTION_NAME_USER = "Invite evaluator (user)";
const ACTION_NAME_EMAIL = "Invite evaluator (email)";

const firstName1 = faker.person.firstName();
const lastName1 = faker.person.lastName();
const email1 = `${firstName1}@example.com`;

const firstName2 = faker.person.firstName();
const lastName2 = faker.person.lastName();
const email2 = `${firstName2}@example.com`;

const firstName3 = faker.person.firstName();
const lastName3 = faker.person.lastName();
const email3 = `${firstName3}@example.com`;

const firstName4 = faker.person.firstName();
const lastName4 = faker.person.lastName();
const email4 = `${firstName4}@example.com`;

const firstName5 = faker.person.firstName();
const lastName5 = faker.person.lastName();
const email5 = `${firstName5}@example.com`;

const firstName6 = faker.person.firstName();
const lastName6 = faker.person.lastName();
const email6 = `${firstName6}@example.com`;

const evalSlug = "evaluation";
const communityFormSlug = "community-form";

const invitedUserId = crypto.randomUUID() as UsersId;

const pub1Id = crypto.randomUUID() as PubsId;

const seed = createSeed({
	community: {
		name: `test community`,
		slug: "test-community",
	},
	pubFields: {
		Title: {
			schemaName: CoreSchemaType.String,
		},
		Content: {
			schemaName: CoreSchemaType.String,
		},
		Email: {
			schemaName: CoreSchemaType.Email,
		},
	},
	users: {
		admin: {
			role: MemberRole.admin,
			password: "password",
		},
		user2: {
			role: MemberRole.contributor,
			password: "xxxx-xxxx",
		},
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
		Evaluation: {
			Title: { isTitle: true },
			Content: { isTitle: false },
			Email: { isTitle: false },
		},
	},
	stages: {
		Evaluating: {
			actions: {
				[ACTION_NAME_USER]: {
					action: Action.email,
					config: {
						subject: "Hello",
						body: "Greetings",
						recipientEmail: email1,
					},
				},
				[ACTION_NAME_EMAIL]: {
					action: Action.email,
					config: {
						subject: "HELLO REVIEW OUR STUFF PLEASE... privately",
						recipientEmail: email2,
						body: `You are invited to fill in a form.\n\n\n\n:link{form="${evalSlug}" text="Wow, a great form!"}\n\n`,
					},
				},
			},
		},
	},
	pubs: [
		{
			id: pub1Id,
			pubType: "Submission",
			values: {
				Title: "The Activity of Snails",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Submission",
			values: {
				Title: "Do not let anyone edit me",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Evaluation",
			values: {},
			stage: "Evaluating",
		},
	],
	forms: {
		Evaluation: {
			slug: evalSlug,
			pubType: "Evaluation",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Content",
					component: InputComponent.textArea,
					config: {
						label: "Content",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Email",
					component: InputComponent.textInput,
					config: {
						label: "Email",
					},
				},
			],
		},
		CommunityForm: {
			slug: communityFormSlug,
			pubType: "Submission",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Form Title",
					},
				},
			],
		},
	},
	invites: {
		expiredEmailInvite: {
			email: email1,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
		},
		acceptedEmailInvite: {
			email: email3,
			status: InviteStatus.accepted,
			lastSentAt: new Date(),
		},
		rejectedEmailInvite: {
			email: `${faker.person.firstName()}@example.com`,
			status: InviteStatus.rejected,
			lastSentAt: new Date(),
		},
		revokedEmailInvite: {
			email: `${faker.person.firstName()}@example.com`,
			status: InviteStatus.revoked,
			lastSentAt: new Date(),
		},
		createdEmailInvite: {
			email: `${faker.person.firstName()}@example.com`,
			status: InviteStatus.created,
		},
		happyPathEmailInvite: {
			email: email2,
			communityLevelFormSlugs: ["Evaluation"],
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
		},
		expiredUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
		},
		acceptedUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.accepted,
			lastSentAt: new Date(),
		},
		rejectedUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.rejected,
			lastSentAt: new Date(),
		},
		revokedUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.revoked,
			lastSentAt: new Date(),
		},
		createdUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.created,
		},
		happyPathUserInvite: {
			userId: invitedUserId,
			communityLevelFormSlugs: ["Evaluation"],
			status: InviteStatus.pending,
			lastSentAt: new Date(),
		},
		rejectEmailInvite: {
			email: email2,
			pubId: pub1Id,
			pubOrStageFormSlugs: ["Evaluation"],
			pubOrStageRole: MemberRole.contributor,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},

		pubLevelFormInvite: {
			email: email4,
			pubId: pub1Id,
			pubOrStageFormSlugs: ["CommunityForm"],
			pubOrStageRole: MemberRole.contributor,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		adminRoleInvite: {
			email: email5,
			communityRole: MemberRole.admin,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		multipleInvite1: {
			email: email6,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		multipleInvite2: {
			email: email6,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		nearlyExpiredInvite: {
			email: email1,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 10),
		},
	},
});

const seed2 = createSeed({
	community: {
		name: `test community 2`,
		slug: "test-community-2",
	},
	users: {
		invitee1: {
			id: invitedUserId,
			role: MemberRole.admin,
			password: "password",
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;
let community2: CommunitySeedOutput<typeof seed2>;

const createInviteUrl = (inviteBasePath: string, inviteToken: string, redirectTo: string) => {
	const inviteUrl = `${inviteBasePath}?invite=${inviteToken}&redirectTo=${redirectTo}`;
	return inviteUrl;
};

export async function setupInviteTestCommunity() {
	// needs to be first bc invites in community1 refer to users in community2
	community2 = await seedCommunity(seed2, {
		randomSlug: false,
	});
	community = await seedCommunity(seed, {
		randomSlug: false,
	});

	const inviteBasePath = `/c/${community.community.slug}/public/invite`;

	for (const [inviteName, invite] of Object.entries(community.invites)) {
		// eslint-disable-next-line no-console
		console.log(
			`${inviteName}:\n\n ${createInviteUrl(
				inviteBasePath,
				invite.inviteToken,
				`/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`
			)}`
		);
	}
}
