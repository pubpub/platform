/* 
	This file is a best practice for using Prisma with Next.js 
	https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
*/

import { PrismaClient } from "@prisma/client"

import { env } from "~/lib/env/env.mjs"

const newClient = () =>
	new PrismaClient({
		omit: {
			user: {
				passwordHash: true,
			},
		},
	})

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof newClient> | undefined
}

const prisma = globalForPrisma.prisma ?? newClient()

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
