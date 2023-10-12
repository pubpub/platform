import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { api } from "contracts";
import { type NextApiRequest, type NextApiResponse } from "next/types";
import crypto from "node:crypto";
import {
	BadRequestError,
	HTTPStatusError,
	UnauthorizedError,
	createPub,
	getSuggestedMembers,
	getMembers,
	getPub,
	getPubType,
	updatePub,
	deletePub,
} from "~/lib/server";
import { emailUser } from "~/lib/server/email";
import { getJobsClient } from "~/lib/server/jobs";
import { validateToken } from "~/lib/server/token";
import { findOrCreateUser } from "~/lib/server/user";

const handleErrors = (error: unknown, req: NextApiRequest, res: NextApiResponse) => {
	if (error instanceof HTTPStatusError) {
		return res.status(error.status).json({ message: error.message });
	}
	if (error instanceof Error) {
		console.error(error.message);
	}
	return res.status(500).json({ message: "Internal Server Error" });
};

const getBearerToken = (authHeader: string) => {
	const parts = authHeader.split("Bearer ");
	if (parts.length !== 2) {
		throw new BadRequestError("Unable to parse authorization header");
	}
	return parts[1];
};

const checkApiKey = (apiKey: string) => {
	const serverKey = process.env.API_KEY;
	if (!serverKey) {
		return;
	}
	if (
		serverKey &&
		serverKey.length === apiKey.length &&
		crypto.timingSafeEqual(Buffer.from(serverKey), Buffer.from(apiKey))
	) {
		return;
	}

	throw new UnauthorizedError("Invalid API key");
};

// TODO: verify pub belongs to integrationInstance probably in some middleware
const integrationsRouter = createNextRoute(api.integrations, {
	auth: async ({ headers }) => {
		const token = getBearerToken(headers.authorization);
		const user = await validateToken(token);
		return { status: 200, body: user };
	},
	getPubType: async ({ headers, params }) => {
		checkApiKey(getBearerToken(headers.authorization));
		const pub = await getPubType(params.pubTypeId);
		return { status: 200, body: pub };
	},
	createPub: async ({ headers, params, body }) => {
		checkApiKey(getBearerToken(headers.authorization));
		const pub = await createPub(params.instanceId, body);
		return { status: 200, body: pub };
	},
	getPub: async ({ headers, params, query }) => {
		checkApiKey(getBearerToken(headers.authorization));
		const depth = query.depth ? Number(query.depth) : 1;
		const pub = await getPub(params.pubId, depth);
		return { status: 200, body: pub };
	},
	getAllPubs: async ({ headers }) => {
		checkApiKey(getBearerToken(headers.authorization));
		return { status: 501, body: { error: "Method not implemented" } };
	},
	updatePub: async ({ headers, params, body }) => {
		checkApiKey(getBearerToken(headers.authorization));
		const updatedPub = await updatePub(params.pubId, body);
		return { status: 200, body: updatedPub };
	},
	deletePub: async ({ headers, params }) => {
		checkApiKey(getBearerToken(headers.authorization));
		await deletePub(params.pubId);
		return {
			status: 200,
			body: {
				message: "Pub deleted",
			},
		};
	},
	sendEmail: async ({ headers, params, body }) => {
		checkApiKey(getBearerToken(headers.authorization));
		const user = await ("userId" in body.to
			? findOrCreateUser(body.to.userId)
			: findOrCreateUser(body.to.email, body.to.firstName, body.to.lastName));
		try {
			const info = await emailUser(
				params.instanceId,
				user,
				body.subject,
				body.message,
				body.extra
			);
		} catch (error) {
			console.log("error", error);
		}
		return { status: 200, body: { info: {} as any, userId: user.id } };
	},
	scheduleEmail: async ({ headers, params, body, query }) => {
		checkApiKey(getBearerToken(headers.authorization));
		const { to, subject, message, extra } = body;
		const jobs = await getJobsClient();
		const user = await ("userId" in to
			? findOrCreateUser(to.userId)
			: findOrCreateUser(to.email, to.firstName, to.lastName));
		const payload = { to: { userId: user.id }, subject, message, extra };
		const job = await jobs.scheduleEmail(params.instanceId, payload, query);
		return { status: 202, body: { job, userId: user.id } };
	},
	unscheduleEmail: async ({ headers, params }) => {
		checkApiKey(getBearerToken(headers.authorization));
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
		checkApiKey(getBearerToken(headers.authorization));
		const user = await ("userId" in body
			? findOrCreateUser(body.userId)
			: findOrCreateUser(body.email, body.firstName, body.lastName));
		return { status: 200, body: user };
	},
	getSuggestedMembers: async ({ headers, query }) => {
		checkApiKey(getBearerToken(headers.authorization));
		const member = await getSuggestedMembers(query.email, query.firstName, query.lastName);
		return { status: 200, body: member };
	},
	getUsers: async ({ headers, query }) => {
		checkApiKey(getBearerToken(headers.authorization));
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
	errorHandler: handleErrors,
	jsonQuery: true,
});
