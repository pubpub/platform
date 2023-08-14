import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { api } from "../../contract";
import { pubQueries, memberQueries } from "server";

const pubRouter = createNextRoute(api.pubs, {
	getPubFields: async ({ params }) => {
		const pubFieldValuePairs = await pubQueries.get(params.pub_id);
		return {
			status: 200,
			body: pubFieldValuePairs,
		};
	},
	putPubFields: async (body) => {
		return {
			status: 200,
			body: {
				id: "qea",
				title: "Watch One Piece",
				body: "Just get to water 7. if you dont like it chill, watch sometyhing welse",
			},
		};
	},
});

const memberRouter = createNextRoute(api.members, {
	suggestMember: async ({ params }) => {
		const member = await memberQueries.get(params.name);
		return {
			status: 200,
			body: member,
		};
	},
});

const router = {
	pubs: pubRouter,
	members: memberRouter,
};

export default createNextRouter(api, router);
