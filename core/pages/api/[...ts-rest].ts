import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { api } from "~/lib/contracts";
import { getPub, getMembers, updatePub } from "~/lib/server";

// TODOD: verify pub belongs to integrationInstance
const pubRouter = createNextRoute(api.pub, {
	getPubFields: async ({ params }) => {
		const pubFieldValuePairs = await getPub(params.pubId);
		return {
			status: 200,
			body: pubFieldValuePairs,
		};
	},
	putPubFields: async ({ params, body }) => {
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
