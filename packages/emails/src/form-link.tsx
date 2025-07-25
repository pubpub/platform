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

import type { Communities } from "db/public";

interface RequestAccessToForm {
	formInviteLink: string;
	community: Pick<Communities, "name" | "avatar" | "slug">;
	form: {
		name: string;
	};
	previewText?: string;
}

/**
 * For when a link to a form is expired
 */
export const FormLink = ({
	community,
	formInviteLink,
	form,
	previewText = `Requesting access to ${form.name}`,
}: RequestAccessToForm) => {
	const baseUrl = process.env.PUBPUB_URL ?? "";

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="mx-auto my-auto bg-white font-sans">
					<Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
						<Section className="mt-[32px]">
							<Img
								src={community.avatar ?? `${baseUrl}/static/logo.svg`}
								width="40"
								height="40"
								alt="PubPub"
								className="mx-auto my-0"
							/>
						</Section>
						<Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
							Link to {form.name}
						</Heading>
						<Text className="text-[14px] leading-[24px] text-black">
							Click the button below to access {form.name} on PubPub.
						</Text>
						<Section className="mb-[32px] mt-[32px] text-center">
							<Button
								className="rounded bg-[#000000] px-4 py-3 text-center text-[12px] font-semibold text-white no-underline"
								href={formInviteLink}
							>
								Access {form.name}
							</Button>
						</Section>
						<Text className="text-[14px] leading-[24px] text-black">
							or copy and paste this URL into your browser:{" "}
							<Link href={formInviteLink} className="text-blue-600 no-underline">
								{formInviteLink}
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
