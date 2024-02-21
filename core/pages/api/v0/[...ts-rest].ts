import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { api } from "contracts";
import { logger } from "logger";
import { compareAPIKeys, getBearerToken } from "~/lib/auth/api";
import {
	createPub,
	deletePub,
	getIntegrationInstanceConfig,
	getIntegrationInstanceState,
	getMembers,
	getPub,
	getPubType,
	getSuggestedMembers,
	setIntegrationInstanceConfig,
	setIntegrationInstanceState,
	tsRestHandleErrors,
	updatePub,
	generateSignedAssetUploadUrl,
} from "~/lib/server";
import { emailUser } from "~/lib/server/email";
import { getJobsClient } from "~/lib/server/jobs";
import { validateToken } from "~/lib/server/token";
import { findOrCreateUser } from "~/lib/server/user";

const checkAuthentication = (authHeader: string) => {
	const apiKey = getBearerToken(authHeader);
	const serverKey = process.env.API_KEY!;
	compareAPIKeys(serverKey, apiKey);
};

// TODO: verify pub belongs to integrationInstance probably in some middleware
const integrationsRouter = createNextRoute(api.integrations, {
	auth: async ({ headers }) => {
		const token = getBearerToken(headers.authorization);
		const user = await validateToken(token);
		return { status: 200, body: user };
	},
	getPubType: async ({ headers, params }) => {
		checkAuthentication(headers.authorization);
		const pub = await getPubType(params.pubTypeId);
		return { status: 200, body: pub };
	},
	createPub: async ({ headers, params, body }) => {
		checkAuthentication(headers.authorization);
		const pub = await createPub(params.instanceId, body);
		return { status: 200, body: pub };
	},
	getPub: async ({ headers, params, query }) => {
		checkAuthentication(headers.authorization);
		const depth = query.depth ? Number(query.depth) : 1;
		const pub = await getPub(params.pubId, depth);
		return { status: 200, body: pub };
	},
	getAllPubs: async ({ headers }) => {
		checkAuthentication(headers.authorization);
		return { status: 501, body: { error: "Method not implemented" } };
	},
	updatePub: async ({ headers, params, body }) => {
		checkAuthentication(headers.authorization);
		const updatedPub = await updatePub(params.pubId, body);
		return { status: 200, body: updatedPub };
	},
	deletePub: async ({ headers, params }) => {
		checkAuthentication(headers.authorization);
		await deletePub(params.pubId);
		return {
			status: 200,
			body: {
				message: "Pub deleted",
			},
		};
	},
	sendEmail: async ({ headers, params, body }) => {
		checkAuthentication(headers.authorization);
		const user = await ("userId" in body.to
			? findOrCreateUser(body.to.userId)
			: findOrCreateUser(body.to.email, body.to.firstName, body.to.lastName));
		try {
			const info = await emailUser(params.instanceId, user, body);
		} catch (error) {
			logger.error("error", error);
		}
		return { status: 200, body: { info: {} as any, userId: user.id } };
	},
	scheduleEmail: async ({ headers, params, body, query }) => {
		checkAuthentication(headers.authorization);
		const { to, subject, message, extra, include } = body;
		const jobs = await getJobsClient();
		const user = await ("userId" in to
			? findOrCreateUser(to.userId)
			: findOrCreateUser(to.email, to.firstName, to.lastName));
		const payload = { to: { userId: user.id }, subject, message, extra, include };
		const job = await jobs.scheduleEmail(params.instanceId, payload, query);
		return { status: 202, body: { job, userId: user.id } };
	},
	unscheduleEmail: async ({ headers, params }) => {
		checkAuthentication(headers.authorization);
		const jobs = await getJobsClient();
		await jobs.unscheduleEmail(params.key);
		return {
			status: 200,
			body: {
				message: "Email unscheduled",
			},
		};
	},
	getOrCreateUser: async ({ headers, body }) => {
		checkAuthentication(headers.authorization);
		const user = await ("userId" in body
			? findOrCreateUser(body.userId)
			: findOrCreateUser(body.email, body.firstName, body.lastName));
		return { status: 200, body: user };
	},
	getSuggestedMembers: async ({ headers, query }) => {
		checkAuthentication(headers.authorization);
		const member = await getSuggestedMembers(query.email, query.firstName, query.lastName);
		return { status: 200, body: member };
	},
	getUsers: async ({ headers, query }) => {
		checkAuthentication(headers.authorization);
		const members = await getMembers(query.userIds);
		return {
			status: 200,
			body: members,
		};
	},
	setInstanceConfig: async ({ headers, params, body }) => {
		checkAuthentication(headers.authorization);
		const config = await setIntegrationInstanceConfig(params.instanceId, { ...body });
		return { status: 200, body: config };
	},
	getInstanceConfig: async ({ headers, params }) => {
		checkAuthentication(headers.authorization);
		const config = await getIntegrationInstanceConfig(params.instanceId);
		return { status: 200, body: config };
	},
	setInstanceState: async ({ headers, params, body }) => {
		checkAuthentication(headers.authorization);
		const state = await setIntegrationInstanceState(params.instanceId, params.pubId, body);
		return { status: 200, body: state };
	},
	getInstanceState: async ({ headers, params }) => {
		checkAuthentication(headers.authorization);
		const state = await getIntegrationInstanceState(params.instanceId, params.pubId);
		return { status: 200, body: state };
	},
	generateSignedAssetUploadUrl: async ({ headers, params, body }) => {
		checkAuthentication(headers.authorization);
		const url = await generateSignedAssetUploadUrl(body.pubId, body.fileName);
		return {
			status: 200,
			body: url,
		};
	},
});

const router = {
	integrations: integrationsRouter,
};

export default createNextRouter(api, router, {
	errorHandler: tsRestHandleErrors,
	jsonQuery: true,
});
