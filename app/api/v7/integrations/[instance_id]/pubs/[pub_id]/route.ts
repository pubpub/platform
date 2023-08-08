import prisma from "prisma/db";
import { NextResponse, NextRequest } from "next/server";

const getPubFields = async (pub_id: string) => {
	const fields = await prisma.pubValue.findMany({
		where: { pubId: pub_id },
		distinct: ["fieldId"],
		orderBy: {
			createdAt: "desc",
		},
		include: {
			field: {
				select: {
					name: true,
				},
			},
		},
	});

	return fields.reduce((prev: any, curr) => {
		prev[curr.field.name] = curr.value;
		return prev;
	}, {});
};

/**
 * @swagger
 * /api/v7/integrations/{instanceId}/pubs/{pubId}:
 *   get:
 *     tags:
 *       - Pub
 *     summary: Finds a Pubs fields given its ID
 *     parameters:
 *       - $ref: '#/components/parameters/instanceId'
 *       - $ref: '#/components/parameters/pubId'
 *     description: Returns a Pubs fields given its ID
 *     responses:
 *       200:
 *          description: A Pubs fields
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/PubFields'
 *                example:
 *                  attack: Gomu-Gomu no Jet Gattling Gun
 *                  level: 2
 *       404:
 *          description: Pub not found
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/PubNotFound'
 *                example: Pub not found
 *       401:
 *          description: Invalid instance ID
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/InvalidInstanceId'
 *                example: Invalid Instance ID
 *       403:
 *         description: You dont have access to do this
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidAccessToken'
 *               example: Invalid API key supplied
 */
export async function GET(request: NextRequest, { params }: { params: { pub_id: string } }) {
	const pub = await getPubFields(params.pub_id);
	return NextResponse.json(pub);
}

/**
 * @swagger
 * /api/v7/integrations/{instanceId}/pubs/{pubId}:
 *   description: Makes a request to update a Pub
 *   put:
 *     tags:
 *       - Pub
 *     summary: Updates fields in a Pub
 *     parameters:
 *       - $ref: '#/components/parameters/instanceId'
 *       - $ref: '#/components/parameters/pubId'
 *     requestBody:
 *       description: PubFields to be added to a Pub
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PubFields'
 *             example:
 *               mode: Gear 4 - Boundman
 *     description: Updates a Pubs field by its ID
 *     responses:
 *       200:
 *         description: A collection of updated Pub fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PubFields'
 *               example:
 *                 attack: Gomu-Gomu no Jet Gattling Gun
 *                 level: 2
 *                 mode: Gear 4 - Boundman
 *       400:
 *         description: Invalid Instance ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidInstanceId'
 *               example: Invalid Instance ID
 *       403:
 *         description: You dont have access to do this
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidAccessToken'
 *               example: Invalid API key supplied
 *       404:
 *          description: Pub not found
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/PubNotFound'
 *                example: Pub not found
 */
export async function PUT(request: NextRequest, { params }: { params: { pub_id: string } }) {
	const { fields } = await request.json();

	const fieldNames = Object.keys(fields);

	const fieldIds = await prisma.pubField.findMany({
		where: {
			name: {
				in: fieldNames,
			},
		},
		select: {
			id: true,
			name: true,
		},
	});

	const newValues = fieldIds.map((field) => {
		return {
			fieldId: field.id,
			value: fields[field.name],
		};
	});

	await prisma.pub.update({
		where: { id: params.pub_id },
		include: {
			values: true,
		},
		data: {
			values: {
				createMany: {
					data: newValues,
				},
			},
		},
	});

	//TODO: we shouldn't query the db twice for this
	const updatedFields = await getPubFields(params.pub_id);

	return NextResponse.json(updatedFields);
}
