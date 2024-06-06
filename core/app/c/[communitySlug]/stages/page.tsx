import { notFound } from "next/navigation";
import { Community } from "@prisma/client";

import { Avatar, AvatarImage } from "ui/avatar";

import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import { getStageWorkflows, makeStagesById } from "~/lib/stages";
import { communityMemberInclude, stageInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import StageList from "./components/StageList";

function defineServerComponent(
	getAvatarImage: ({ community }: { community: Community }) => Promise<string>
) {
	const component = async ({ community }: { community: Community }) => {
		const avatarImage = await getAvatarImage({ community });
		return (
			<Avatar>
				<AvatarImage src={avatarImage} />
			</Avatar>
		);
	};

	return component;
}

const ServerCompenent = defineServerComponent(
	async ({ community }) => "https://avatars.githubusercontent.com/u/1000?v=4"
);

const getCommunityBySlug = async (communitySlug: string) => {
	return await prisma.community.findUnique({
		where: { slug: communitySlug },
		include: {
			stages: {
				include: stageInclude,
			},
			members: {
				include: communityMemberInclude,
			},
		},
	});
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	const community = await getCommunityBySlug(params.communitySlug);
	if (!community) {
		notFound();
	}
	const token = await createToken(loginData.id);
	const stageWorkflows = getStageWorkflows(community.stages);

	const stageById = makeStagesById(community.stages);

	const communityPubFields = await db
		.selectFrom("pub_fields")
		.distinctOn("pub_fields.id")
		.innerJoin("pub_values", "pub_values.field_id", "pub_fields.id")
		.innerJoin("pubs", "pubs.id", "pub_values.pub_id")
		//.innerJoin('communities', 'communities.id', 'pubs.community_id')
		.where("pubs.community_id", "=", community.id)
		.select([
			"pub_fields.id",
			"pub_fields.name",
			"pub_fields.pubFieldSchemaId",
			"pub_fields.slug",
		])

		.unionAll(
			db
				.selectFrom("pub_fields")
				.distinctOn("pub_fields.id")
				.innerJoin("_PubFieldToPubType", "pub_fields.id", "_PubFieldToPubType.A")
				.innerJoin("pub_types", "pub_types.id", "_PubFieldToPubType.B")
				.innerJoin("communities", "communities.id", "pub_types.community_id")
				.where("communities.id", "=", community.id)
				.select([
					"pub_fields.id",
					"pub_fields.name",
					"pub_fields.pubFieldSchemaId",
					"pub_fields.slug",
				])
		)

		.execute();

	//	console.log(communityPubFields);

	return (
		<>
			<div className="mb-16 flex items-center justify-between">
				<h1 className="text-xl font-bold">Stages</h1>
				<ServerCompenent community={community} />
				{/* <S /> */}
			</div>
			{communityPubFields.map((field) => {
				return (
					<div key={field.id}>
						<h3>
							{field.slug} {field.name}
						</h3>
					</div>
				);
			})}
			<StageList
				members={community.members}
				stageWorkflows={stageWorkflows}
				stageById={stageById}
				token={token}
				loginData={loginData}
			/>
		</>
	);
}
