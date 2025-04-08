import * as React from "react";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

import type { Communities, Forms, MembershipType, Pubs, Stages } from "db/public";
import { MemberRole } from "db/public";

type SignupInvitePropsBase = {
	inviteLink: string;
	community: Pick<Communities, "name" | "avatar" | "slug">;
	communityRole: MemberRole;
	previewText?: string;
};

type SignupInviteCommunity = SignupInvitePropsBase & {
	type: "community";
};

type SignupInviteForm = SignupInvitePropsBase & {
	type: "form";
	form: Pick<Forms, "name" | "slug">;
};

type SignupInvitePub = SignupInvitePropsBase & {
	type: "pub";
	pub: Pick<Pubs, "title">;
	otherRole: MemberRole;
};

type SignupInviteStage = SignupInvitePropsBase & {
	type: "stage";
	stage: Pick<Stages, "name">;
	otherRole: MemberRole;
};

type SignupInviteProps =
	| SignupInviteCommunity
	| SignupInviteForm
	| SignupInvitePub
	| SignupInviteStage;

export const Invite = ({
	community: comm,
	inviteLink,
	previewText = `Join ${comm?.name} on PubPub`,
	...rest
}: SignupInviteProps) => {
	const baseUrl = process.env.PUBPUB_URL ?? "";

	const community = comm ?? {
		name: "CrocCroc",
		avatar: `${baseUrl}/demo/croc.png`,
		slug: "croccroc",
	};

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="mx-auto my-auto bg-white font-sans">
					<Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
						<Section className="mt-[32px]">
							<Img
								src={community.avatar ?? `${baseUrl}/apple-icon.png`}
								width="40"
								height="40"
								alt="PubPub"
								className="mx-auto my-0"
							/>
						</Section>
						<Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
							Join {community.name} on PubPub
						</Heading>
						<Text className="text-[14px] leading-[24px] text-black">
							You have been invited to become{" "}
							{role === MemberRole.contributor ? "a" : "an"} <strong>{role}</strong>{" "}
							of the {membership.type} <em>{membership.name}</em> on PubPub. Click the
							button below to finish your registration and join {community.name} on
							PubPub.
						</Text>
						<Section className="mb-[32px] mt-[32px] text-center">
							<Button
								className="rounded bg-[#000000] px-4 py-3 text-center text-[12px] font-semibold text-white no-underline"
								href={signupLink}
							>
								Join PubPub
							</Button>
						</Section>
						<Text className="text-[14px] leading-[24px] text-black">
							or copy and paste this URL into your browser:{" "}
							<Link href={signupLink} className="text-blue-600 no-underline">
								{signupLink}
							</Link>
						</Text>
						<Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
						<Text className="text-[12px] leading-[24px] text-[#666666]">
							If you were not expecting this invitation, you can ignore this email. If
							you are concerned about your account's safety, please reply to this
							email to get in touch with us.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
