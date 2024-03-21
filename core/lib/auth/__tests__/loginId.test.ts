import { expect, test, vi } from "vitest";
import { getUserInfoFromJWT } from "../loginId";

vi.mock("~/lib/supabaseServer", () => ({
	getServerSupabase: vi.fn(() => ({
		auth: {
			refreshSession: vi.fn(),
		},
	})),
}));

vi.mock("server-only", () => {
	return;
});

vi.mock("lib/env/env.mjs", () => ({
	env: {
		JWT_SECRET: "super-secret-jwt-token-with-at-least-32-characters-long",
	},
}));

test("getUserInfoFromJWT returns a user from a well-formed JWT", async () => {
	const jwt =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzEwOTg0NjYwLCJpYXQiOjE3MTA5ODEwNjAsInN1YiI6IjhhNjI0MDIyLTMyNzQtNGJkMi04YjZjLTU3ODU0NjdlODRjYyIsImVtYWlsIjoia2FsaWxAa25vd2xlZGdlZnV0dXJlcy5vcmciLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImNhbkFkbWluIjp0cnVlLCJjb21tdW5pdHlJZCI6IjAzZTdhNWZkLWJkY2EtNDY4Mi05MjIxLTNhNjk5OTJjMWYzYiIsImNvbW11bml0eU5hbWUiOiJVbmpvdXJuYWwiLCJjb21tdW5pdHlTbHVnIjoidW5qb3VybmFsIiwiZmlyc3ROYW1lIjoiS2FsaWwiLCJsYXN0TmFtZSI6IlNtaXRoLW51ZXZlbGxlIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3MTA5NjM5Nzh9XSwic2Vzc2lvbl9pZCI6IjUxYjU1ZmMwLTg4OGUtNDZiOS1iMDMxLThiMTdiZGUzOTU2ZCJ9.RfpuZDAdlFq-6BaR4-aHl4D2Q4juAQ5Jo7YRav61U4I";
	const refresh = "abqPOcUm37PxjsvxHqxaFw";
	const user = await getUserInfoFromJWT(jwt, refresh);
	expect(user).not.toBeNull();
	expect(user!.email).toBe("kalil@knowledgefutures.org");
});
