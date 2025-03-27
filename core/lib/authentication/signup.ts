import type {
	CommunitiesId,
	FormsId,
	Invites,
	InvitesId,
	MemberRole,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";

export class InviteService {
	// Starting points - factory methods
	static inviteByEmail(email: string) {
		return new InviteBuilder().forEmail(email);
	}

	static inviteByUserId(userId: UsersId) {
		return new InviteBuilder().forUser(userId);
	}

	// The rest of the service methods for managing invites
	async getInviteByToken(token: string) {}
	async acceptInvite(token: string) {}
	async revokeInvite(inviteId: InvitesId, reason?: string) {}
}

// Builder for fluent invitation creation
class InviteBuilder {
	private inviteData: Partial<Invites> = {
		status: "CREATED",
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
	};

	forEmail(email: string) {
		this.inviteData.email = email;
		return this;
	}

	forUser(userId: UsersId) {
		this.inviteData.userId = userId;
		return this;
	}

	forCommunity(communityId: CommunitiesId) {
		this.inviteData.communityId = communityId;
		return this;
	}

	forPub(pubId: PubsId) {
		this.inviteData.pubId = pubId;
		return this;
	}

	forForm(formId: FormsId) {
		this.inviteData.formId = formId;
		return this;
	}

	forStage(stageId: StagesId) {
		this.inviteData.stageId = stageId;
		return this;
	}

	as(role: MemberRole) {
		if (this.inviteData.pubId) {
			this.inviteData.otherRole = role;
		} else {
			this.inviteData.communityRole = role;
		}
		return this;
	}

	withMessage(message: string) {
		this.inviteData.message = message;
		return this;
	}

	expires(date: Date) {
		this.inviteData.expiresAt = date;
		return this;
	}

	expiresInDays(days: number) {
		this.inviteData.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
		return this;
	}

	async create() {
		// Validate required fields
		this.validateInviteData();

		// Generate token
		this.inviteData.token = await this.generateUniqueToken();

		// Create in database
		const invite = await prisma.invite.create({
			data: this.inviteData as any,
		});

		return invite;
	}

	async send() {
		const invite = await this.create();

		// Send email
		await sendInviteEmail(invite);

		// Update status
		await prisma.invite.update({
			where: { id: invite.id },
			data: {
				status: "SENT",
				sentAt: new Date(),
				lastSentAt: new Date(),
				sendAttempts: 1,
			},
		});

		return invite;
	}

	private validateInviteData() {
		// Make sure we have either email or userId
		if (!this.inviteData.email && !this.inviteData.userId) {
			throw new Error("Invite must have either email or userId");
		}

		// Make sure we have communityId
		if (!this.inviteData.communityId) {
			throw new Error("Invite must have a community");
		}

		// Additional validations as needed
	}

	private async generateUniqueToken(): Promise<string> {
		// Generate unique token for the invite
		// ...
	}
}
