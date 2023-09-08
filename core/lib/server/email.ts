import { smtpclient } from './mailgun';
import prisma from '~/prisma/db';
import { BadRequestError, NotFoundError } from './errors';
import { slugifyString } from '../string';
import type { User } from '@prisma/client';
import { createToken } from './token';



type Context = {
    user: {
        id: string,
        name?: string,
    }
    // pubId: string,
    instanceId: string,
}

const interpolate = async (message: string, context: Context) => {
    let user: User | null;
    const getUserField = (field) => {
        return async () => {
            if (user) {
                return user[field]
            } else {
                user = await prisma.user.findUnique({
                    where: {
                        id: context.user.id
                    }
                })
                if (!user) {
                    throw new Error(`User ${context.user.id} not found`)
                }
                return user[field]
            }
        }
    }

    const varRegex = /\{\{\s*([^} ]*)\s*\}\}/g

    const supportedVars = {
        'user.token': async () => {
            return await createToken(context.user.id)
        },
        'user.name': context.user?.name || getUserField('name'),
        'user.id': context.user.id,
        'instance.id': context.instanceId,
    }

    const usedVars = Array.from(message.matchAll(varRegex));
    const vars = {}
    for (const [_, varName] of usedVars) {
        const getter = supportedVars[varName];
        if (!getter) {
            throw new BadRequestError(`Variable ${varName} not supported in email templates`)
        }
        if (typeof getter === 'function') {
            vars[varName] = await getter();
        } else {
            vars[varName] = getter;
        }
    }

    const interpolatedMessage = message.replaceAll(varRegex, (_, varName) => {
        return vars[varName]
    });

    return interpolatedMessage;
}

export const emailUser = async ({ email, name, userId }: { email?: string, name?: string, userId?: string }, subject: string, message: string, instanceId: string) => {
    let user: User | null;
    if (!(email || userId)) {
        throw new BadRequestError(`One of email or userId must be supplied`)
    }
    if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            throw new NotFoundError(`User ${userId} not found`)
        }
        email = user.email
    } else {
        user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            if (!name) {
                throw new BadRequestError(`Name must be included for ${email}`)
            }
            user = await prisma.user.create({
                data: {
                    email: email!,
                    slug: slugifyString(email!),
                    name: name
                }
            })

            if (!user) {
                throw new Error(`Unable to create user for ${email}`)
            }
        }
    }

    const html = await interpolate(message, {
        user: {
            id: user.id,
            name: user.name,
        },
        instanceId
    });

    await smtpclient.sendMail({
        from: 'PubPub Team <hello@mg.pubpub.org>',
        to: email,
        replyTo: 'hello@pubpub.org',
        html,
        subject
    })
}