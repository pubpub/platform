"use client";

import NextLink from "next/link";
import { Button, Card, CardContent, CardHeader } from "ui";
import { IntegrationData } from "./page";

type Props = { instances: NonNullable<IntegrationData>, token: string };

const getTitle = (pub: Props["instances"][number]["pubs"][number]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	return titleValue?.value as string;
};

const getSettingsUrl = (instance: Props["instances"][number], token) => {
	const url = new URL(instance.integration.settingsUrl)
	url.searchParams.set('instanceId', instance.id)
	url.searchParams.set('token', token)
	return url.toString()
}

const IntegrationList: React.FC<Props> = function ({ instances, token}) {
	return (
		<div>
			<Card className="mb-10 bg-gray-50">
				<CardHeader>Add Integrations</CardHeader>
				<CardContent>
					<div className="flex">
						<div className="bg-gray-100 rounded mr-10 h-12 w-24" />
						<div className="bg-gray-100 rounded mr-10 h-12 w-24" />
						<div className="bg-gray-100 rounded mr-10 h-12 w-24" />
						<div className="bg-gray-100 rounded mr-10 h-12 w-24" />
					</div>
				</CardContent>
			</Card>
			{instances.map((instance) => {
				return (
					<Card className="mb-10" key={instance.id}>
						<CardContent>
							<div className="flex justify-between">
								<div>
									<div className="text-sm">{instance.integration.name}</div>
									<div>{instance.name}</div>
									<div className="mt-4">
										{instance.pubs.map((pub) => {
											return (
												<div className="text-sm">
													Attached to pub:{" "}
													<span className="font-bold">
														{getTitle(pub)}
													</span>
												</div>
											);
										})}
										{instance.stages.map((stage) => {
											return (
												<div className="text-sm">
													Attached to all pubs in stage:{" "}
													<span className="font-bold">{stage.name}</span>
												</div>
											);
										})}
									</div>
								</div>
								<Button variant="outline" asChild>
									<NextLink href={getSettingsUrl(instance, token)}>
										Configure
									</NextLink>
								</Button>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
};
export default IntegrationList;
