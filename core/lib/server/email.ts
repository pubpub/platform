import type { Prisma, User } from "@prisma/client";
import { Eta } from "eta";
import prisma from "~/prisma/db";
import { IntegrationAction } from "../types";
import { BadRequestError, NotFoundError } from "./errors";
import { smtpclient } from "./mailgun";
import { createToken } from "./token";
import { GetPubResponseBodyBase, SendEmailRequestBody } from "contracts";
import { pubValuesInclude } from "../types";

type Node = string | { t: string; val: string };

const staticTokens = new Set([
	"user.token",
	"user.id",
	"user.firstName",
	"user.lastName",
	"instance.id",
]);
const dynamicTokens = /^(instance\.actions|extra|pubs|users)\.(.+)$/;
const commentRegex = /\/\*([\s\S]*?)\*\//g;

const plugin = {
	processAST(nodes: Node[]) {
		const next: unknown[] = [];
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (typeof node === "string") {
				// Accept any string
				next.push(node);
			} else if (node.t === "i") {
				// Strip pure comment interpolations
				if (node.val.replace(commentRegex, "") === "") {
					continue;
				}
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
	autoEscape: false,
	// <%= it.user.id %> becomes <%= user.id %>
	functionHeader:
		"const user=it.user,instance=it.instance,extra=it.extra,pubs=it.pubs,users=it.users;",
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

const makeProxy = <T extends Record<string, unknown>>(obj: T, prefix: string) => {
	return new Proxy(obj, {
		get(target, prop) {
			if (typeof prop !== "string") {
				throw new BadRequestError("Invalid token");
			}
			if (!(prop in target)) {
				throw new BadRequestError(`Invalid token ${prefix}.${prop}`);
			}
			return target[prop];
		},
	});
};

const pubInclude = {
	...pubValuesInclude,
	assignee: {
		select: {
			id: true,
			slug: true,
			avatar: true,
			firstName: true,
			lastName: true,
			email: true,
		},
	},
} satisfies Prisma.PubInclude;

type EmailTemplatePub = {
	id: string;
	pubTypeId: string;
	values: Record<string, Prisma.JsonValue>;
	assignee: Prisma.UserGetPayload<(typeof pubInclude)["assignee"]> | null;
};

const userSelect = {
	firstName: true,
	lastName: true,
	email: true,
} satisfies Prisma.UserSelect;

type EmailTemplateUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

const makeTemplateApi = async (
	instance: Prisma.IntegrationInstanceGetPayload<{ include: typeof instanceInclude }>,
	user: User,
	body: SendEmailRequestBody
) => {
	const actions = (instance.integration.actions as IntegrationAction[]).reduce(
		(actions, action) => {
			actions[action.name] = action.href;
			return actions;
		},
		{} as Record<string, string>
	);
	// TODO: Batch these calls using prisma.findMany() or equivalent.
	// Load included pubs.
	const pubs: { [pubId: string]: EmailTemplatePub } = {};
	if (body.include?.pubs) {
		for (const pubAlias in body.include.pubs) {
			const pubId = body.include.pubs[pubAlias];
			const pub = await prisma.pub.findUnique({
				where: { id: pubId },
				include: pubInclude,
			});
			if (pub) {
				pubs[pubAlias] = {
					id: pub.id,
					pubTypeId: pub.pubTypeId,
					values: pub.values.reduce((prev, curr) => {
						prev[curr.field.slug] = curr.value;
						return prev;
					}, {} as Record<string, Prisma.JsonValue>),
					assignee: pub.assignee,
				};
			}
		}
	}
	// Load included users.
	const users: { [userId: string]: EmailTemplateUser } = {};
	if (body.include?.users) {
		for (const userAlias in body.include.users) {
			const userId = body.include.users[userAlias];
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { id: true, firstName: true, lastName: true, email: true },
			});
			if (user) {
				users[userAlias] = user;
			}
		}
	}
	const api = {
		instance: { id: instance.id, actions: makeProxy(actions, "instance.actions") },
		user: {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			get token() {
				return createToken(user.id);
			},
		},
		pubs: makeProxy(pubs, "pubs"),
		users: makeProxy(users, "users"),
	};

	const parsedExtra: Record<string, string> = {};

	for (const key in body.extra) {
		parsedExtra[key] = await eta.renderStringAsync(body.extra[key], api);
	}

	return {
		...api,
		extra: parsedExtra,
	};
};

export const emailUser = async (instanceId: string, user: User, body: SendEmailRequestBody) => {
	const instance = await prisma.integrationInstance.findUnique({
		where: { id: instanceId },
		include: { ...instanceInclude, community: { select: { name: true } } },
	});

	if (!instance) {
		throw new NotFoundError(`Integration instance ${instanceId} not found`);
	}

	const templateApi = await makeTemplateApi(instance, user, body);
	const subject = await eta.renderStringAsync(body.subject, templateApi);
	const html = await eta.renderStringAsync(body.message, templateApi);
	const { accepted, rejected } = await smtpclient.sendMail({
		from: `${instance.community.name || "PubPub Team"} <hello@mg.pubpub.org>`,
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
