/* eslint-disable n/no-process-env */
import * as React from "react";
import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface ForgotPasswordProps {
	firstName: string;
	lastName?: string;
	resetPasswordLink: string;
	previewText?: string;
}

export const PasswordReset = ({
	firstName = "ANDY",
	lastName = "Rocha",
	resetPasswordLink,
	previewText = `Reset your PubPub password`,
}: ForgotPasswordProps) => {
	const baseUrl = process.env.PUBPUB_URL ? process.env.PUBPUB_URL : "";

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="mx-auto my-auto bg-white font-sans">
					<Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
						<Section className="mt-[32px]">
							<Img
								src={`${baseUrl}/static/logo.svg`}
								width="40"
								height="40"
								alt="PubPub"
								className="mx-auto my-0"
							/>
						</Section>
						<Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
							Reset your PubPub password
						</Heading>
						<Text className="text-[14px] leading-[24px] text-black">
							Hello {firstName},
						</Text>
						<Text className="text-[14px] leading-[24px] text-black">
							You can use the button below to reset your password. If you were not
							expecting this invitation, you can ignore this email. If you are
							concerned about your account's safety, please reply to this email to get
							in touch with us.
						</Text>
						<Section className="mb-[32px] mt-[32px] text-center">
							<Button
								className="rounded bg-[#000000] px-4 py-3 text-center text-[12px] font-semibold text-white no-underline"
								href={resetPasswordLink}
							>
								Reset your password
							</Button>
						</Section>
						<Text className="text-[14px] leading-[24px] text-black">
							or copy and paste this URL into your browser:{" "}
							<Link href={resetPasswordLink} className="text-blue-600 no-underline">
								{resetPasswordLink}
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
