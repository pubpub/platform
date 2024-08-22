import type { Node as NodeMdast } from "mdast";
import type { Directive } from "micromark-extension-directive";

import { expect, test, vi } from "vitest";

import type { MembersId, UsersId } from "db/public";

import type { RenderWithPubContext } from "./renderWithPubUtils";
import { visitValueDirective } from "./renderMarkdownWithPub";

vi.mock("server-only", () => {
	return {
		// mock server-only module
	};
});

// Needed for https://github.com/pubpub/v7/pull/530#issuecomment-2305237258
vi.mock("react", () => {
	return {
		cache: vi.fn(),
	};
});

const mockUser = (overrides?: Partial<RenderWithPubContext["recipient"]["user"]>) => {
	const id = overrides?.id ?? "123";
	const merged = {
		id: id as UsersId,
		firstName: "Jane",
		lastName: "Admin",
		email: "all@pubpub.org",
		...overrides,
	};
	const user: RenderWithPubContext["recipient"] = {
		id: id as MembersId,
		user: merged,
	};
	return user;
};

test.each([
	{
		attributes: { field: "test-community:evaluator", firstName: "", lastName: "" },
		expected: "Another User",
	},
	{
		attributes: { field: "test-community:admin", firstName: "", lastName: "" },
		expected: "Admin Important",
	},
	{
		attributes: { field: "test-community:evaluator", firstName: "", email: "" },
		expected: "Another another@pubpub.org",
	},
	{
		attributes: { field: "test-community:evaluator", email: "" },
		expected: "another@pubpub.org",
	},
	// 'role' is not a field the user is allowed to index on, will default to just using the member-id
	{
		attributes: { field: "test-community:evaluator", role: "" },
		expected: "789",
	},
] as { attributes: Record<string, string>; expected: string }[])(
	"visitValueDirective with member fields",
	async ({ attributes, expected }) => {
		const node: NodeMdast & Directive = {
			type: "textDirective",
			name: "test",
			attributes,
		};
		const recipient = mockUser({
			id: "123456" as UsersId,
			firstName: "Favorite",
			lastName: "Recipient",
		});
		const users = [
			mockUser({
				id: "456" as UsersId,
				firstName: "Admin",
				lastName: "Important",
				email: "admin@pubpub.org",
			}),
			mockUser({
				id: "789" as UsersId,
				firstName: "Another",
				lastName: "User",
				email: "another@pubpub.org",
			}),
		];
		const pub = {
			id: "987",
			pubType: { id: "456", name: "Submission" },
			createdAt: new Date("2024-07-03T16:03:31.375Z"),
			values: {
				"test-community:evaluator": "789",
				"test-community:admin": "456",
			},
		};
		const context: RenderWithPubContext = {
			recipient,
			users,
			communitySlug: "test-community",
			pub,
		};
		visitValueDirective(node, context);
		const expectedData = {
			hName: "span",
			hChildren: [
				{
					type: "text",
					value: expected,
				},
			],
		};
		expect(node.data).toEqual(expectedData);
	}
);
