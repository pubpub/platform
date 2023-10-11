import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { api } from "contracts";
import { compareAPIKeys, getBearerToken } from "~/lib/auth/api";
import {
	createPub,
	getSuggestedMembers,
	getMembers,
	getPub,
	getPubType,
	tsRestHandleErrors,
	updatePub,
} from "~/lib/server";
import { emailUser } from "~/lib/server/email";
import { getJobsClient } from "~/lib/server/jobs";
import { validateToken } from "~/lib/server/token";

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
	sendEmail: async ({ headers, params, body }) => {
		checkAuthentication(headers.authorization);
		const info = await emailUser(body.to, body.subject, body.message, params.instanceId);
		return { status: 200, body: info };
	},
	scheduleEmail: async ({ headers, params, body, query }) => {
		checkAuthentication(headers.authorization);
		const jobs = await getJobsClient();
		const job = await jobs.sendEmail(params.instanceId, body, query);
		return { status: 202, body: job };
	},
	getSuggestedMembers: async ({ headers, query }) => {
		checkAuthentication(headers.authorization);
		const member = await getSuggestedMembers(query.email, query.firstName, query.lastName);
		return { status: 200, body: member };
	},
	getMembers: async ({ headers, query }) => {
		checkAuthentication(headers.authorization);
		const members = await getMembers(query.userIds);
		return {
			status: 200,
			body: members,
		};
	},
});

const router = {
	integrations: integrationsRouter,
};

export default createNextRouter(api, router, {
	errorHandler: tsRestHandleErrors,
});
