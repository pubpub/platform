import Link from "next/link";
import type { Prisma, PubField, PubFieldSchema, PubValue } from "@prisma/client";
import type { AnySchema, JSONSchemaType } from "ajv";

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Button } from "ui/button";
import { CardContent, CardHeader, CardTitle } from "ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";
import { Separator } from "ui/separator";

import IntegrationActions from "~/app/components/IntegrationActions";
import MembersAvatars from "~/app/components/MemberAvatar";
import { PubTitle } from "~/app/components/PubTitle";
import { getLoginData } from "~/lib/auth/loginData";
import cn from "~/lib/cn";
import type { FileUpload } from "~/lib/fields/fileUpload";
import { getPubUsers } from "~/lib/permissions";
import { createToken } from "~/lib/server/token";
import { pubInclude } from "~/lib/types";
import prisma from "~/prisma/db";
import { PubChildrenTable } from "./PubChildrenTable";

interface PubFieldWithValue extends PubField {
	schema: PubFieldSchema | null;
}
interface PubValueWithFieldAndSchema extends PubValue {
	field: PubFieldWithValue;
}

function FileUploadPreview({ files }: { files: FileUpload }) {
	return (
		<ul>
			{files.map((file) => {
				return (
					<li key={file.fileName}>
						<HoverCard>
							<HoverCardTrigger asChild>
								<Button variant="link">{file.fileName}</Button>
							</HoverCardTrigger>
							<HoverCardContent className=" m-auto w-auto space-y-1">
								<h4 className="text-sm font-semibold">
									{file.fileName} <br />
								</h4>
								<p className="pb-2 text-sm">
									The file is <strong>{file.fileSize}</strong> bytes in size. Its
									MIME type is <strong>{file.fileType}</strong>.
								</p>
								<Button variant="secondary">
									<a target="_blank" href={file.fileUploadUrl}>
										Open file in new tab
									</a>
								</Button>
							</HoverCardContent>
						</HoverCard>
					</li>
				);
			})}
		</ul>
	);
}

function recursivelyGetScalarFields(schema: JSONSchemaType<AnySchema>, value: Prisma.JsonValue) {
	const fields: any[] = [];
	if (schema.$id === "pubpub:fileUpload") {
		return <FileUploadPreview files={value as FileUpload} />;
	}
	// TODO: get schema IDs and render specific stuff -- e.g. file upload, confidence intervals
	if (!schema.properties) {
		switch (schema.type) {
			case "boolean":
				fields.push(<p>{JSON.stringify(value)}</p>);
				break;
			case "string":
				fields.push(<p>{value as string}</p>);
				break;
			default:
				fields.push(<p>{JSON.stringify(value)}</p>);
				break;
		}
	} else {
		const objectSchema = schema.properties as JSONSchemaType<AnySchema>;
		for (const [fieldKey, fieldSchema] of Object.entries(objectSchema)) {
			fields.push(
				<>
					{fieldSchema.title && (
						<CardHeader>
							<CardTitle className={cn("text-sm")}>{fieldSchema.title}</CardTitle>
						</CardHeader>
					)}
					<CardContent>
						{recursivelyGetScalarFields(
							fieldSchema as JSONSchemaType<AnySchema>,
							value![fieldKey]
						)}
					</CardContent>
				</>
			);
		}
	}
	return fields;
}

function renderField(fieldValue: PubValueWithFieldAndSchema) {
	const JSONSchema = fieldValue.field.schema
		? (fieldValue.field.schema.schema as JSONSchemaType<AnySchema>)
		: null;
	const fieldTitle = (JSONSchema && JSONSchema.title) || fieldValue.field.name;
	// if there's no schema we assume it's a string
	const renderedField = JSONSchema
		? recursivelyGetScalarFields(JSONSchema, fieldValue.value)
		: fieldValue.value && fieldValue.value.toString();
	return (
		<>
			<Separator />
			<CardHeader>
				<CardTitle className={cn("text-base")}>{fieldTitle}</CardTitle>
			</CardHeader>
			<CardContent>{renderedField}</CardContent>
		</>
	);
}

export default async function Page({
	params,
}: {
	params: { pubId: string; communitySlug: string };
}) {
	const loginData = await getLoginData();
	if (!loginData) {
		return null;
	}
	let token;
	token = await createToken(loginData.id);
	if (!params.pubId || !params.communitySlug) {
		return null;
	}
	const getPub = async (pubId: string) => {
		return await prisma.pub.findUnique({
			where: { id: pubId },
			include: {
				...pubInclude,
			},
		});
	};
	const pub = await getPub(params.pubId);
	if (!pub) {
		return null;
	}
	const users = getPubUsers(pub.permissions);

	return (
		<div className="mb-20">
			<div className="pb-6">
				<Link href={`/c/${params.communitySlug}/pubs`}>
					<Button>View all pubs</Button>
				</Link>
			</div>
			<div className="flex flex-col pb-8">
				<h3>{pub.pubType.name}</h3>
				<PubTitle pub={pub} />
			</div>
			<div className="flex max-w-[100%] flex-row space-x-2">
				<div>
					{pub.values
						.filter((value) => {
							return value.field.name !== "Title";
						})
						.map((value) => {
							return (
								<div className="" key={value.id}>
									{/* What does this div actually look like if a value could be a PDF? */}
									<div>{renderField(value)}</div>
								</div>
							);
						})}
				</div>
				<div className="h-100% flex min-w-[250px] flex-col bg-gray-50 p-2 font-semibold shadow-inner">
					<div className="pb-3">
						{/* TODO: build workflow as series of move constraints? */}
						<div>Current Stage</div>
						<div className="indent-4 font-medium">
							{pub.stages.map(({ stage }) => {
								return <div key={stage.id}>{stage.name}</div>;
							})}
						</div>
					</div>
					<MembersAvatars pub={pub} />
					<div className="pb-3">
						<div>Integrations</div>
						<div>
							<IntegrationActions pub={pub} token={token} />
						</div>
					</div>

					<div className="pb-3">
						<div>Members</div>
						<div className="flex flex-row">
							{users.map((user) => {
								return (
									<div key={user.id}>
										<Avatar className="mr-2 h-8 w-8">
											<AvatarImage src={user.avatar || undefined} />
											<AvatarFallback>{user.firstName[0]}</AvatarFallback>
										</Avatar>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
			Hello New Worlds
			<PubChildrenTable communities={[]} />
		</div>
	);
}
