"use client";

import NextLink from "next/link";
import { Button, Card, CardContent, CardHeader } from "ui";
import { IntegrationData } from "./page";
import { Row, RowContent, RowFooter } from "~/app/components/Row";

type Props = { instances: NonNullable<IntegrationData>; token: string };

const getTitle = (pub: Props["instances"][number]["pubs"][number]) => {
	const titleValue = pub.values.find((value) => {
		return value.field.name === "Title";
	});
	return titleValue?.value as string;
};

const getSettingsUrl = (instance: Props["instances"][number], token) => {
	const url = new URL(instance.integration.settingsUrl);
	url.searchParams.set("instanceId", instance.id);
	url.searchParams.set("token", token);
	return url.toString();
};

const IntegrationList: React.FC<Props> = function ({ instances, token }) {
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
					<Row className="mb-10" key={instance.id}>
						<RowContent className="flex justify-between">
							<div>
								<div className="text-sm text-gray-500">
									{instance.integration.name}
								</div>
								<h3 className="text-md font-semibold">{instance.name}</h3>
								<div className="mt-4">
									{instance.pubs.map((pub) => {
										return (
											<div className="text-sm">
												Attached to pub:{" "}
												<span className="font-bold">{getTitle(pub)}</span>
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
						</RowContent>
						<RowFooter>
							{instance.stage && (
								<div className="text-sm">
									Attached to all pubs in stage:{" "}
									<span className="font-bold">{instance.stage.name}</span>
								</div>
							)}
						</RowFooter>
					</Row>
				);
			})}
		</div>
	);
};
export default IntegrationList;
