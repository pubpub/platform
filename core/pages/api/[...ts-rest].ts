import { createNextRoute, createNextRouter } from "@ts-rest/next";
import { api } from "../../contract";

const router = createNextRoute(api, {
	posts: {
		getPosts: async () => {
			// const body = await GetPosts.instance.execute();
			return {
				status: 200,
				body: [{
					id: "qea",
					title: "Watch One Piece",
					body: "Just get to water 7. if you dont like it chill, watch sometyhing welse",
				}],
			};
		},
		createPost: async (body) => {
			// const body = await CreatePost.instance.execute();
			return {
				status: 200,
				body: {
					id: "qea",
					title: "Watch One Piece",
					body: "Just get to water 7. if you dont like it chill, watch sometyhing welse",
				},
			};
		}
	},
});

export default createNextRouter(api, router);
