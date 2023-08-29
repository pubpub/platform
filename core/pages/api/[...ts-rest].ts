import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { api } from "~/lib/contracts";
import { getPub, getMembers, updatePub, createPub, NotFoundError } from "~/lib/server";

// TODO: verify pub belongs to integrationInstance
const pubRouter = createNextRoute(api.pub, {
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
	updatePub: async ({ params, body }) => {
		const updatedPub = await updatePub(params.pubId, body);
		return {
			status: 200,
			body: updatedPub,
		};
	},
});

const autosuggestRouter = createNextRoute(api.autosuggest, {
	suggestMember: async ({ params }) => {
		const member = await getMembers(params.memberCandidateString);
		return {
			status: 200,
			body: member,
		};
	},
});

const router = {
	pub: pubRouter,
	autosuggest: autosuggestRouter,
};

export default createNextRouter(api, router);
