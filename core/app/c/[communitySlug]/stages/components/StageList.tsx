"use client";

import Link from "next/link";
import { Fragment } from "react";
import { Button } from "ui/button";
import PubRow from "~/app/components/PubRow";
import { getPubUsers } from "~/lib/permissions";
import { moveConstraintSourcesForStage } from "~/lib/stages";
import { CommunityMemberPayload, StagePayload, StagesById, UserLoginData } from "~/lib/types";
import { StagePubActions } from "./StagePubActions";

type Props = {
	loginData: UserLoginData;
	members: CommunityMemberPayload[];
	stageById: StagesById;
	stageWorkflows: StagePayload[][];
	token: string;
};
type IntegrationAction = { text: string; href: string; kind?: "stage" };

function StageList(props: Props) {
	return (
		<div>
			{
				props.stageWorkflows.map((stages) => {
					return (
						<div>
							{stages.map((stage) => {
								const users = getPubUsers(stage.permissions);
								// users should be just member but these are users

								const sources = moveConstraintSourcesForStage(
									stage,
									props.stageById
								);
								const destinations = stage.moveConstraints.map(
									(stage) => stage.destination
								);
								return (
									<div key={stage.id} className="mb-20">
										<div className="flex flex-row justify-between">
											<h3 className="font-semibold text-lg mb-2">
												{stage.name}
											</h3>
											{stage.integrationInstances.map((instance) => {
												if (!Array.isArray(instance.integration.actions)) {
													return null;
												}
												return (
													<Fragment key={instance.id}>
														{instance.integration.actions?.map(
															(action: IntegrationAction) => {
																if (action.kind === "stage") {
																	const href = new URL(
																		action.href
																	);
																	href.searchParams.set(
																		"instanceId",
																		instance.id
																	);
																	href.searchParams.set(
																		"token",
																		props.token
																	);
																	return (
																		<Button
																			key={action.text}
																			variant="outline"
																			size="sm"
																			asChild
																		>
																			<Link
																				href={href.toString()}
																			>
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
										</div>
										{stage.pubs.map((pub, index, list) => {
											return (
												<Fragment key={pub.id}>
													<PubRow
														key={pub.id}
														pub={pub}
														token={props.token}
														actions={
															<StagePubActions
																key={stage.id}
																loginData={props.loginData}
																members={props.members}
																moveFrom={sources}
																moveTo={destinations}
																pub={pub}
																stage={stage}
															/>
														}
													/>
													{index < list.length - 1 && <hr />}
												</Fragment>
											);
										})}
									</div>
								);
							})}
						</div>
					);
				})[0]
			}
		</div>
	);
}
export default StageList;
