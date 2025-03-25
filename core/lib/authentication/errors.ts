export const SIGNUP_ERRORS = [
	"NOT_LOGGED_IN",
	"ALREADY_MEMBER",
	"NOT_ALLOWED",
	"COMMUNITY_NOT_FOUND",
	"EMAIL_ALREADY_EXISTS",
] as const;
export type SIGNUP_ERROR = (typeof SIGNUP_ERRORS)[number];

export const SignupErrors = {
	NOT_LOGGED_IN: (props: { communityName: string }) => ({
		error: `You must be logged in to join ${props.communityName}`,
		type: "NOT_LOGGED_IN" as const,
	}),
	ALREADY_MEMBER: (props: { communityName: string }) => ({
		error: `You are already a member of ${props.communityName}`,
		type: "ALREADY_MEMBER" as const,
	}),
	NOT_ALLOWED: (props: { communityName: string }) => ({
		error: `Public signups are not allowed for ${props.communityName}`,
		type: "NOT_ALLOWED" as const,
	}),
	COMMUNITY_NOT_FOUND: (props: { communityName: string }) => ({
		error: `Community not found`,
		type: "COMMUNITY_NOT_FOUND" as const,
	}),
	EMAIL_ALREADY_EXISTS: (props: { email: string }) => ({
		error: `Email ${props.email} already exists`,
		type: "EMAIL_ALREADY_EXISTS" as const,
	}),
} as const satisfies {
	[E in SIGNUP_ERROR]:
		| ((props: { communityName: string }) => {
				type: E;
				error: string;
		  })
		| ((props: { email: string }) => {
				type: E;
				error: string;
		  });
};
