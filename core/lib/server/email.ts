import type { Prisma, User } from "@prisma/client";
import { Eta } from "eta";
import prisma from "~/prisma/db";
import { IntegrationAction } from "../types";
import { BadRequestError, NotFoundError } from "./errors";
import { smtpclient } from "./mailgun";
import { createToken } from "./token";

type To = { email: string; firstName: string; lastName: string } | { userId: string };
type Node = string | { t: string; val: string };

const staticTokens = new Set([
	"user.token",
	"user.id",
	"user.firstName",
	"user.lastName",
	"instance.id",
]);
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
	const actionUrls = (instance.integration.actions as IntegrationAction[]).reduce(
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
			firstName: user.firstName,
			lastName: user.lastName,
			get token() {
				return createToken(user.id);
			},
		},
	};
};

export const emailUser = async (
	instanceId: string,
	user: User,
	subject: string,
	message: string
) => {
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
		include: instanceInclude,
	});

	if (!instance) {
		throw new NotFoundError(`Integration instance ${instanceId} not found`);
	}

	const html = await eta.renderStringAsync(message, makeTemplateApi(instance, user));
	const { accepted, rejected } = await smtpclient.sendMail({
		from: "PubPub Team <hello@mg.pubpub.org>",
		to: user.email,
		replyTo: "hello@pubpub.org",
		html,
		subject,
	});

	return {
		accepted,
		rejected,
	};
};
