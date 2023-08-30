import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { api } from "~/lib/contracts";
import { getPub, getMembers, updatePub, createPub, NotFoundError } from "~/lib/server";
import { validateToken } from "~/lib/server/token";

// TODO: verify pub belongs to integrationInstance probably in some middleware
// TODO: verify token in header
const integrationsRouter = createNextRoute(api.integrations, {
	createPub: async ({ params, body }) => {
		try {
			const pub = await createPub(params.instanceId, body);
			return { status: 200, body: pub };
		} catch (error) {
			if (error instanceof NotFoundError) {
				return {
					status: 404,
					body: { message: error.message },
				};
			}
			return {
				status: 500,
				body: { message: "Internal Server Error" },
			};
		}
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
	auth: async ({ headers, body, params }) => {
		try {
			const user = await validateToken(body.token);

			return {
				status: 200,
				body: user,
			}
		} catch (err) {
			return {
				status: 403,
				body: {
					error: err.message
				}
			}
		}
	}
});

const router = {
	integrations: integrationsRouter,
};

export default createNextRouter(api, router);
