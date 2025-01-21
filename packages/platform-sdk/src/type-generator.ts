import fs from "fs/promises";
import path from "path";

import type { PubTypeWithFields } from "contracts";
import type {
	CommunitiesId,
	PubFields,
	PubFieldSchemaId,
	PubFieldsId,
	PubTypes,
	PubTypesId,
} from "db/public";
import { CoreSchemaType } from "db/public";

import type { Prettify } from "./types";

type SchemaNameToTypeMap = {
	[CoreSchemaType.Boolean]: boolean;
	[CoreSchemaType.DateTime]: Date;
	[CoreSchemaType.Email]: string;
	[CoreSchemaType.MemberId]: string;
	[CoreSchemaType.Number]: number;
	[CoreSchemaType.NumericArray]: number[];
	[CoreSchemaType.RichText]: { type: "doc"; content: unknown[] };
	[CoreSchemaType.String]: string;
	[CoreSchemaType.StringArray]: string[];
	[CoreSchemaType.Vector3]: [number, number, number];
	[CoreSchemaType.URL]: string;
	[CoreSchemaType.Null]: null;
	[CoreSchemaType.FileUpload]: {
		id: string;
		name: string;
		type: string;
		size: number;
		url: string;
	};
};

type SchemaNameToType<T extends CoreSchemaType> = SchemaNameToTypeMap[T];

const schemaNameToSortOfType = {
	[CoreSchemaType.Boolean]: true as boolean,
	[CoreSchemaType.DateTime]: new Date() as Date,
	[CoreSchemaType.Email]: "" as string,
	[CoreSchemaType.MemberId]: "" as string,
	[CoreSchemaType.Number]: 1 as number,
	[CoreSchemaType.NumericArray]: [1, 2, 3] as number[],
	[CoreSchemaType.RichText]: { type: "doc", content: [] } as { type: "doc"; content: unknown[] },
	[CoreSchemaType.String]: "" as string,
	[CoreSchemaType.StringArray]: ["hey"] as string[],
	[CoreSchemaType.Vector3]: [1, 2, 3] as [number, number, number],
	[CoreSchemaType.URL]: "hey" as string,
	[CoreSchemaType.Null]: null,
	[CoreSchemaType.FileUpload]: {} as {
		id: string;
		name: string;
		type: string;
		size: number;
		url: string;
	},
} as const satisfies Record<CoreSchemaType, any>;

const schemaNameToType = {
	[CoreSchemaType.Boolean]: "boolean",
	[CoreSchemaType.DateTime]: "Date",
	[CoreSchemaType.Email]: "string",
	[CoreSchemaType.MemberId]: "string",
	[CoreSchemaType.Number]: "number",
	[CoreSchemaType.NumericArray]: "number[]",
	[CoreSchemaType.RichText]: "{ type: 'doc'; content: unknown[] }",
	[CoreSchemaType.String]: "string",
	[CoreSchemaType.StringArray]: "string[]",
	[CoreSchemaType.Vector3]: "[number, number, number]",
	[CoreSchemaType.URL]: "string",
	[CoreSchemaType.Null]: "null",
	[CoreSchemaType.FileUpload]: "{}",
} as const satisfies Record<CoreSchemaType, string>;

const toSafeTypeName = (name: string) => {
	return name.replace(/[^a-zA-Z0-9]/g, "_");
};

const slugToSafeTypeName = (slug: string) => {
	const slugParts = slug.split(":");

	const candidateSlug = slugParts[slugParts.length - 1] ?? slugParts[0];

	const typeName = toSafeTypeName(candidateSlug);

	if (!typeName) {
		throw new Error(`Invalid slug: ${slug}`);
	}
	return typeName;
};

const createSchemaNameToTypeMap = () => {
	return `export type SchemaNameToTypeMap = {
    [CoreSchemaType.Boolean]: boolean;
    [CoreSchemaType.DateTime]: Date;
    [CoreSchemaType.Email]: string;
    [CoreSchemaType.MemberId]: string;
    [CoreSchemaType.Number]: number;
    [CoreSchemaType.NumericArray]: number[];
    [CoreSchemaType.RichText]: { type: "doc"; content: unknown[] };
    [CoreSchemaType.String]: string;
    [CoreSchemaType.StringArray]: string[];
    [CoreSchemaType.Vector3]: [number, number, number];
    [CoreSchemaType.URL]: string;
    [CoreSchemaType.Null]: null;
    [CoreSchemaType.FileUpload]: {
        id: string;
        name: string;
        type: string;
        size: number;
        url: string;
    };
}`;
};

const createPubFieldTypes = (pubTypes: PubTypeWithFields[]) => {
	const allFieldsFromPubTypes = pubTypes.flatMap((pubType) => Object.values(pubType.fields));

	// get unique fields

	const uniqueFields = allFieldsFromPubTypes.filter(
		(field, index, self) => index === self.findIndex((t) => t.slug === field.slug)
	);

	const fieldTypes = uniqueFields.map((field) => {
		return `export type PubField_${slugToSafeTypeName(field.slug)} = {
    id: string;
    name: "${field.name}";
    slug: "${field.slug}";
    schemaName: CoreSchemaType.${field.schemaName};
    isRelation: ${field.isRelation};
    isTitle: ${field.isTitle};
}`;
	});

	return `${fieldTypes.join("\n\n")};

export type PubField = ${uniqueFields.map((field) => `PubField_${slugToSafeTypeName(field.slug)}`).join(" | ")};`;
};

const createPubTypeTypes = (pubTypes: PubTypeWithFields[]) => {
	const pubTypeTypeNames = pubTypes.map(
		(pubType) => `PubType_${slugToSafeTypeName(pubType.name)}`
	);

	const pubTypeTypes = pubTypes.map((pubType) => {
		return `export type PubType_${slugToSafeTypeName(pubType.name)} = {
            id: PubTypesId;
            createdAt: Date;
            updatedAt: Date;
            communityId: CommunitiesId;
            name: "${pubType.name}";
            description: ${pubType.description ? `"${pubType.description}"` : "null"};
            fields: (${pubType.fields.map((field) => `PubField_${slugToSafeTypeName(field.slug)}`).join(" | ")})[];
        }`;
	});

	return `${pubTypeTypes.join("\n\n")};

export type PubType = ${pubTypeTypeNames.join(" | ")}`;
};

const createPubFieldTypeToValueType = () => {
	return `export type PubFieldToValueType<T extends PubField> = Prettify<{
    id: PubFieldsId;
    createdAt: Date;
    updatedAt: Date;
    fieldSlug: T["slug"];
    fieldName: T["name"];
    schemaName: T["schemaName"];
    value: SchemaNameToTypeMap[T["schemaName"]];
} & (T["isRelation"] extends true ? {
    relatedPubId: PubTypesId | null;
	relatedPub: Pub | null;
    } : {
      relatedPubId: null;
	  relatedPub?: never;
})>`;
};

const createPubTypes = (pubTypes: PubTypeWithFields[]) => {
	const pubs = pubTypes.map((pubType) => {
		return `export type Pub_${slugToSafeTypeName(pubType.name)} = {
    id: PubsId;
	title: string;
	parentId: PubsId;
	depth: number;
    pubTypeId: PubTypesId;
    stageId: StagesId;
    communityId: CommunitiesId;
    createdAt: Date;
    updatedAt: Date;
    pubTypeName: "${pubType.name}";
    pubType: PubType_${slugToSafeTypeName(pubType.name)};
    values: (${pubType.fields
		.map((field) => `PubFieldToValueType<PubField_${slugToSafeTypeName(field.slug)}>`)
		.join(" | ")})[]
}`;
	});

	return `${pubs.join("\n\n")}

export type Pub = ${pubTypes.map((pubType) => `Pub_${slugToSafeTypeName(pubType.name)}`).join(" | ")}
`;
};

export async function generateTypeDefinitions(pubTypes: PubTypeWithFields[], outputPath: string) {
	// Generate the type definition file content
	const typeContent = `// Generated by PubPub Type Generator
import type { CoreSchemaType, PubFieldsId, PubTypesId, CommunitiesId, StagesId, PubsId } from "db/public";

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export interface PubTypeField {
    id: PubFieldsId;
    name: string;
    slug: string;
    schemaName: CoreSchemaType;
    isRelation: boolean;
    isTitle: boolean;
}

export interface PubTypeDefinition {
    createdAt: Date;
    updatedAt: Date;
    id: PubTypesId;
    communityId: CommunitiesId;
    name: string;
    description: string | null;
    fields: PubTypeField[];
}

${createSchemaNameToTypeMap()}

${createPubFieldTypes(pubTypes)}

${createPubTypeTypes(pubTypes)}

${createPubFieldTypeToValueType()}

${createPubTypes(pubTypes)}

export interface CommunitySchema {
    pubTypes: {
        ${pubTypes
			.map(
				(pubType) => `"${pubType.name}": {
                id: "${pubType.id}",
                name: "${pubType.name}",
                description: ${pubType.description ? `"${pubType.description}"` : "null"},
                fields: {
                    ${pubType.fields
						.map(
							(field) => `"${field.slug}": {
                        id: "${field.id}",
                        name: "${field.name}",
                        slug: "${field.slug}",
                        schemaName: CoreSchemaType.${field.schemaName},
                        isRelation: ${field.isRelation},
                        isTitle: ${field.isTitle}
                    }`
						)
						.join(",\n                    ")}
                }
            }`
			)
			.join(",\n        ")}
    }
}
`;
	// Ensure the output directory exists
	await fs.mkdir(path.dirname(outputPath), { recursive: true });

	// Write the type definition file
	await fs.writeFile(outputPath, typeContent);

	return typeContent;
}

// Infer the values type for a specific PubType
// type InferPubTypeValues<T extends PubTypeDefinition, ParentPub extends Pub<any>> = Prettify<{
// 	[K in keyof T["fields"]]: {
// 		id: T["fields"][K]["id"];
// 		fieldName: T["fields"][K]["name"];
// 		fieldSlug: T["fields"][K]["slug"];
// 		schemaName: T["fields"][K]["schemaName"];
// 		value: T["fields"][K]["schemaName"];
// 		relatedPubId?: string | null;
// 		relatedPub?: T["fields"][K]["isRelation"] extends true ? ParentPub : null;
// 	};
// }>;

// export type Pub<T extends PubTypeDefinition> = T extends PubTypeDefinition
// 	? {
// 			id: string;
// 			pubTypeName: T["name"];
// 			pubType: T;
// 			values: InferPubTypeValues<T, Pub>[keyof T["fields"]];
// 		}
// 	: never;
