import { Fragment } from "react";
import Link from "next/link";

import { Button } from "ui/button";

import type {
	CommunityMemberPayload,
	StagePayload,
} from "~/lib/server/_legacy-integration-queries";
import PubRow from "~/app/components/PubRow";
import { getPubUsers } from "~/lib/permissions";
import { StagePubActions } from "./StagePubActions";

type Props = {
	members: CommunityMemberPayload[];
	stageWorkflows: StagePayload[][];
	token: string;
	communityStages: StagePayload[];
};
type IntegrationAction = { text: string; href: string; kind?: "stage" };

function StageList(props: Props) {
	return (
		<div>
			{props.stageWorkflows.map((stages) => {
				return (
					<div key={stages[0].id}>
						{stages.map((stage) => {
							const users = getPubUsers(stage.permissions);
							// users should be just member but these are users
							return (
								<div key={stage.id} className="mb-20">
									<div className="flex flex-row justify-between">
										<h3 className="mb-2 text-lg font-semibold">{stage.name}</h3>
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
									{stage.pubs.map(({ pub }, index, list) => {
										return (
											<Fragment key={pub.id}>
												<PubRow
													key={pub.id}
													pub={pub}
													token={props.token}
													actions={
														<StagePubActions
															key={stage.id}
															members={props.members}
															pub={pub}
															stage={stage}
															communityStages={props.communityStages}
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
			})}
		</div>
	);
}
export default StageList;
