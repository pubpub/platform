import crypto from 'crypto';
import prisma from '~/prisma/db';


const generateToken = () => {
	const bytesLength = 16;
	return crypto.randomBytes(bytesLength).toString('base64url');
};

export const validateToken = async (token: string) => {
	const [tokenId, tokenString] = token.split('.');

	const {hash, expiresAt, user} = await prisma.authToken.findFirstOrThrow({
		where: {
			id: tokenId,
		},
		include: {
			user: true,
		},
	});

	if (expiresAt < new Date()) {
		throw new Error('Expired token')
	}

	if (!crypto.timingSafeEqual(Buffer.from(hash), crypto.createHash('sha512').update(tokenString).digest())) {
		// Token is invalid
		throw new Error('Unauthorized')
	}

	return user
}

export const createToken = async (userId: string) => {
	const tokenString = generateToken();
	const hash = crypto.createHash('sha512').update(tokenString).digest('hex');
	const token = await prisma.authToken.create({
		data: {
			userId,
			hash,
		},
	});
	return `${token.id}.${tokenString}`
}

export const deleteToken = async (tokenId: string) => { 
	await prisma.authToken.delete({
		where: {
			id: tokenId,
		},
	});
}