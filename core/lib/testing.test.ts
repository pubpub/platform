import { expect, test } from "vitest";

import { createSeed } from "./testing";

test("createSeed works", async () => {
	console.log(
		await createSeed({
			communities: {
				users: [
					{
						firstName: "jimoty",
					},
				],
			},
		})
	);
});
