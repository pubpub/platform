import type { Prisma, User } from "@prisma/client";
import { Eta } from "eta";
import prisma from "~/prisma/db";
import { slugifyString } from "../string";
import { BadRequestError, NotFoundError } from "./errors";
import { smtpclient } from "./mailgun";
import { createToken } from "./token";

type To = { email: string; name: string } | { userId: string };
type Node = string | { t: string; val: string };

const staticTokens = new Set(["user.token", "user.id", "user.name", "instance.id"]);
const dynamicTokens = /^instance\.actions\.(\w+)$/;

const plugin = {
	processAST(nodes: Node[]) {
		const next: unknown[] = [];
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (typeof node === "string") {
				// Accept any string
				next.push(node);
			} else if (node.t === "i") {
				// Accept valid tokens
				if (!staticTokens.has(node.val) && !dynamicTokens.test(node.val)) {
					throw new BadRequestError(`Invalid token ${node.val}`);
				}
				// Await async tokens
				next.push(node.val === "user.token" ? { t: "i", val: "await user.token" } : node);
			} else {
				// Disable code execution and raw expressions
				throw new BadRequestError("Invalid message syntax");
			}
		}
		return next;
	},
};

const eta = new Eta({
	functionHeader: "const user=it.user,instance=it.instance",
	// <%= token %> becomes {{= token }}
	tags: ["{{", "}}"],
	// {{= token }} becomes {{ token }}
	parse: { exec: ".", interpolate: "", raw: "." },
	// Register a plugin that disables unsafe features and desugars async tokens
	plugins: [plugin],
	// TODO: enable caching for static and/or hot messages
	cache: false,
});

const instanceInclude = {
	integration: {
		select: {
			actions: true,
		},
	},
} satisfies Prisma.IntegrationInstanceInclude;

const makeTemplateApi = (
	instance: Prisma.IntegrationInstanceGetPayload<{ include: typeof instanceInclude }>,
	user: User
) => {
	const actionUrls = (instance.integration.actions as { name: string; url: string }[]).reduce(
		(actions, action) => {
			actions[action.name] = action.href;
			return actions;
		},
		{} as Record<string, string>
	);
	const actions = new Proxy(actionUrls, {
		get(target, prop) {
			if (typeof prop !== "string") {
				throw new BadRequestError("Invalid token");
			}
			if (!(prop in target)) {
				throw new BadRequestError(`Invalid token instance.actions.${prop}`);
			}
			return target[prop];
		},
	});
	return {
		instance: { id: instance.id, actions },
		user: {
			id: user.id,
			name: user.name,
			get token() {
				return createToken(user.id);
			},
		},
	};
};

export const emailUser = async (
	to: Readonly<To>,
	subject: string,
	message: string,
	instanceId: string
) => {
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
		include: instanceInclude,
	});

	if (!instance) {
		throw new NotFoundError(`Integration instance ${instanceId} not found`);
	}

	let user: User;
	let email: string;
	if ("userId" in to) {
		// Requester is sending an email to existing user
		const dbUser = await prisma.user.findUnique({ where: { id: to.userId } });
		if (!dbUser) {
			throw new NotFoundError(`User ${to.userId} not found`);
		}
		user = dbUser;
		email = dbUser.email;
	} else {
		// Requester wishes to find or create user from an email address
		const dbUser = await prisma.user.findUnique({ where: { email: to.email } });
		if (dbUser) {
			user = dbUser;
		} else {
			try {
				user = await prisma.user.create({
					data: {
						email: to.email,
						slug: slugifyString(to.email),
						name: to.name,
					},
				});
			} catch (cause) {
				throw new Error(`Unable to create user for ${to.email}`, { cause });
			}
		}
		email = user.email;
	}

	const html = await eta.renderStringAsync(message, makeTemplateApi(instance, user));
	const { accepted, rejected } = await smtpclient.sendMail({
		from: "PubPub Team <hello@mg.pubpub.org>",
		to: email,
		replyTo: "hello@pubpub.org",
		html,
		subject,
	});

	return {
		accepted,
		rejected,
	};
};
