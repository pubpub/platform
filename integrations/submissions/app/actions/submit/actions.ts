"use server";

import { headers } from "next/headers";
import { captureException, withServerActionInstrumentation } from "@sentry/nextjs";

import type { PubValues } from "@pubpub/sdk";

import { getInstanceConfig } from "~/lib/instance";
import { makePubFromDoi, makePubFromTitle, makePubFromUrl } from "~/lib/metadata";
import { client } from "~/lib/pubpub";

export const submit = async (instanceId: string, values: PubValues, assigneeId: string) => {
	return withServerActionInstrumentation(
		"submit",
		{
			headers: headers(),
		},
		async () => {
			try {
				const instance = await getInstanceConfig(instanceId);
				if (instance === undefined) {
					return { error: "Instance not configured" };
				}
				const pub = await client.createPub(instanceId, {
					assigneeId,
					values,
					pubTypeId: instance.pubTypeId,
				});
				return pub;
			} catch (error) {
				captureException(error);
				return { error: error.message };
			}
		}
	);
};

const metadataResolvers = {
	"legacy-unjournal:doi": makePubFromDoi,
	"legacy-unjournal:url": makePubFromUrl,
	"legacy-unjournal:title": makePubFromTitle,
};

export const resolveMetadata = async (
	identifierName: string,
	identifierValue: string
): Promise<Record<string, unknown> | { error: string }> => {
	return withServerActionInstrumentation(
		"resolveMetadata",
		{
			headers: headers(),
		},
		async () => {
			const resolve = metadataResolvers[identifierName];
			try {
				if (resolve !== undefined) {
					const pub = await resolve(identifierValue);
					if (pub !== null) {
						return pub;
					}
				}
			} catch (error) {
				captureException(error);
				return { error: "There was an error resolving metadata." };
			}
			return { error: "No metdata found." };
		}
	);
};
