import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { type NextApiRequest, type NextApiResponse } from "next/types";
import { api } from "contracts";
import {
	HTTPStatusError,
	createPub,
	getMembers,
	getPub,
	updatePub,
} from "~/lib/server";
import { emailUser } from "~/lib/server/email";
import { validateToken } from "~/lib/server/token";
import { compareAPIKeys, getBearerToken } from "~/lib/auth/api";

const handleErrors = (error: unknown, req: NextApiRequest, res: NextApiResponse) => {
	if (error instanceof HTTPStatusError) {
		return res.status(error.status).json({ message: error.message });
	}
	if (error instanceof Error) {
		console.error(error.message);
	}
	return res.status(500).json({ message: "Internal Server Error" });
};

const checkAuthentication = (authHeader: string) => {
	const apiKey = getBearerToken(authHeader)
	const serverKey = process.env.API_KEY!;
	compareAPIKeys(serverKey, apiKey)
};

// TODO: verify pub belongs to integrationInstance probably in some middleware
// TODO: verify token in header
const integrationsRouter = createNextRoute(api.integrations, {
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
	getSuggestedMembers: async ({ headers, params }) => {
		checkAuthentication(headers.authorization);
		const member = await getMembers(params.memberCandidateString);
		return { status: 200, body: member };
	},
	auth: async ({ headers }) => {
		const token = getBearerToken(headers.authorization);
		const user = await validateToken(token);
		return { status: 200, body: user };
	},
	sendEmail: async ({ headers, params, body }) => {
		checkAuthentication(headers.authorization);
		const info = await emailUser(body.to, body.subject, body.message, params.instanceId);
		return { status: 200, body: info };
	},
});

const router = {
	integrations: integrationsRouter,
};

export default createNextRouter(api, router, {
	errorHandler: handleErrors,
});
