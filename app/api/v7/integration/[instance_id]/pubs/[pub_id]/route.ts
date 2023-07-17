import prisma from "prisma/db";
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { pub_id: string } }) {
	const fields = await prisma.pubValue.findMany({
		where: { pubId: params.pub_id },
		distinct: ['fieldId'],
		orderBy: {
			createdAt: 'desc'
		},
		include: {
			field: {
				select: {
					name: true,
				}
			}
		}
	})

	// Raw query version that actually uses DISTINCT under the hood
	//
	// const fields: any[] = await prisma.$queryRaw`SELECT DISTINCT ON (field_id) pub_values.value, pub_fields.name, MAX(pub_values.created_at) FROM pub_values JOIN pub_fields ON pub_fields.id = pub_values.field_id WHERE pub_id = ${params.pub_id} GROUP BY field_id, pub_values.id, name`

	const pub = fields.reduce((prev: any, cur) => {
		prev[cur.field.name] = cur.value
		return prev
	}, {})
	return NextResponse.json(pub);
}


// TODO: integrations will send field ids, not names
export async function PUT(request: NextRequest, { params }: { params: { pub_id: string } }) {
	const { fields: fieldData } = await request.json();

	const fieldNames = Object.keys(fieldData)

	const fieldIds = await prisma.pubField.findMany({
		where: {
			name: {
				in: fieldNames
			}
		},
		select: {
			id: true,
			name: true,
		}
	});

	const newValues = fieldIds.map((field) => {
		return {
			fieldId: field.id,
			value: fieldData[field.name],
		}
	});

	const updatedPub = await prisma.pub.update({
		where: { id: params.pub_id },
		include: {
			values: true,
		},
		data: {
			values: {
				createMany: {
					data: newValues
				}
			}
		}
	});

	return NextResponse.json(updatedPub);
}