import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { type NextApiRequest, type NextApiResponse } from "next/types";
import { api } from "~/lib/contracts";
import { getPub, getMembers, updatePub, createPub, HTTPStatusError } from "~/lib/server";
import { validateToken } from "~/lib/server/token";

const handleErrors = (error: unknown, req: NextApiRequest, res: NextApiResponse) => {
	if (error instanceof HTTPStatusError) {
		return res.status(error.status).json({ message: error.message });
	}
	if (error instanceof Error) {
		console.error(error.message);
	}
	return res.status(500).json({ message: "Internal Server Error" });
};

// TODO: verify pub belongs to integrationInstance probably in some middleware
// TODO: verify token in header
const integrationsRouter = createNextRoute(api.integrations, {
	createPub: async ({ params, body }) => {
		const pub = await createPub(params.instanceId, body);
		return { status: 200, body: pub };
	},
	getPub: async ({ params }) => {
		const pubFieldValuePairs = await getPub(params.pubId);
		return {
			status: 200,
			body: pubFieldValuePairs,
		};
	},
	getAllPubs: async ({ params }) => {
		return {
			status: 200,
			body: [{ message: "This is not implemented" }],
		};
	},
	updatePub: async ({ params, body }) => {
		const updatedPub = await updatePub(params.pubId, body);
		return {
			status: 200,
			body: updatedPub,
		};
	},
	getSuggestedMembers: async ({ params }) => {
		const member = await getMembers(params.memberCandidateString);
		return {
			status: 200,
			body: member,
		};
	},
	auth: async ({ headers }) => {
		const user = await validateToken(headers.authorization.split("Bearer ")[1]);
		return {
			status: 200,
			body: user,
		};
	},
});

const router = {
	integrations: integrationsRouter,
};

export default createNextRouter(api, router, {
	errorHandler: handleErrors,
});
