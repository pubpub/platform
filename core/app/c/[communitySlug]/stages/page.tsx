import prisma from "~/prisma/db";
import { getLoginData } from "~/lib/auth/loginData";
import { createToken } from "~/lib/server/token";
import { StagePayloadMoveConstraintDestination, stageInclude } from "~/lib/types";
import Link from "next/link";
import { Fragment } from "react";
import { Button, Card, CardContent } from "ui";
import PubRow from "~/components/PubRow";
import { getPubUsers, getStageMoveConstraints } from "~/lib/permissions";
import { StagePubActions } from "./StagePubActions";
import { unstable_cache } from "next/cache";

type IntegrationAction = { text: string; href: string; kind?: "stage" };

const getCommunityStages = async (communitySlug: string) => {
	const community = await prisma.community.findUnique({
		where: { slug: communitySlug },
	});
	if (!community) {
		return null;
	}
	// When trying to render the workflows a member can see. We look at the pubs they can see, get the workflows associated, and then show all those.
	return await prisma.stage.findMany({
		where: { communityId: community.id },
		include: stageInclude,
	});
};

const getCachedCommunityStages = async (communitySlug: string) => {
	const data = unstable_cache(
		async () => {
			const community = await prisma.community.findUnique({
				where: { slug: communitySlug },
			});
			if (!community) {
				return null;
			}
			// When trying to render the workflows a member can see. We look at the pubs they can see, get the workflows associated, and then show all those.
			return await prisma.stage.findMany({
				where: { communityId: community.id },
				include: stageInclude,
			});
		},
		["cache-key"],
		{
			tags: ["stages"],
			revalidate: 24,
		}
	);
	return data();
};

type Props = { params: { communitySlug: string } };

export default async function Page({ params }: Props) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	let token;
	token = await createToken(loginData.id);
	// const stages = await getCommunityStages(params.communitySlug);
	const stages = await getCachedCommunityStages(params.communitySlug);
	if (!stages) {
		return null;
	}
	return (
		<>
			<h1 style={{ marginBottom: "2em" }}>Stages</h1>
			<div>
				{stages.map((stage) => {
					const users = getPubUsers(stage.permissions);
					const moveStages: StagePayloadMoveConstraintDestination[] =
						getStageMoveConstraints(stage.moveConstraints);

					return (
						<div key={stage.id} className="mb-20">
							<h3 className="font-bold text-lg mb-2">{stage.name}</h3>
							{stage.integrationInstances.map((instance) => {
								if (!Array.isArray(instance.integration.actions)) {
									return null;
								}
								return (
									<Fragment key={instance.id}>
										{instance.integration.actions?.map(
											(action: IntegrationAction) => {
												if (action.kind === "stage") {
													const href = new URL(action.href);
													href.searchParams.set(
														"instanceId",
														instance.id
													);
													href.searchParams.set("token", token);
													return (
														<Button
															key={action.text}
															variant="outline"
															size="sm"
															asChild
														>
															<Link href={href.toString()}>
																{action.text}
															</Link>
														</Button>
													);
												}
											}
										)}
									</Fragment>
								);
							})}
							<Card>
								<CardContent className="pt-4">
									{stage.pubs.map((pub, index, list) => {
										return (
											<Fragment key={pub.id}>
												<PubRow
													key={pub.id}
													pub={pub}
													token={token}
													actions={
														<StagePubActions
															key={stage.id}
															pub={pub}
															stage={stage}
															users={users}
															loginData={loginData}
															stages={moveStages}
														/>
													}
												/>
												{index < list.length - 1 && <hr />}
											</Fragment>
										);
									})}
								</CardContent>
							</Card>
						</div>
					);
				})}
			</div>
		</>
	);
}
