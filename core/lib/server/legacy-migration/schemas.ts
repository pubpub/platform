import { z } from "zod";

const baseTimestampsSchema = z.object({
	createdAt: z.string(),
	updatedAt: z.string(),
});

const baseUserSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	fullName: z.string(),
	avatar: z.string().nullable(),
	slug: z.string(),
	initials: z.string(),
	title: z.string(),
	orcid: z.string(),
});

const attributionSchema = z
	.object({
		id: z.string(),
		name: z.string().nullable(),
		avatar: z.string().nullable(),
		title: z.string().nullable(),
		order: z.number(),
		isAuthor: z.boolean().nullable(),
		roles: z.array(z.string()).nullable(),
		affiliation: z.string().nullable(),
		orcid: z.string().nullable(),
		userId: z.string().nullable(),
		pubId: z.string().optional(),
		collectionId: z.string().optional(),
		user: baseUserSchema.nullable(),
	})
	.merge(baseTimestampsSchema);

const downloadSchema = z.object({
	url: z.string(),
	type: z.string(),
});
// .merge(baseTimestamps);

const exportSchema = z
	.object({
		id: z.string(),
		format: z.string().nullish(),
		url: z.string().nullish(),
		historyKey: z.number(),
		pubId: z.string(),
		workerTaskId: z.string(),
	})
	.merge(baseTimestampsSchema);

const docJsonSchema = z.object({
	type: z.literal("doc"),
	attrs: z.record(z.any()).optional(),
	content: z.array(z.any()),
});

const draftSchema = z
	.object({
		id: z.string(),
		latestKeyAt: z.string(),
		firebasePath: z.string(),
		doc: z
			.object({
				content: docJsonSchema,
				size: z.number(),
				mostRecentRemoteKey: z.number(),
				firstTimestamp: z.number(),
				latestTimestamp: z.number(),
				historyData: z.object({
					timestamps: z.record(z.number()),
					currentKey: z.number(),
					latestKey: z.number(),
				}),
				firebasePath: z.string(),
			})
			.nullable(),
	})
	.merge(baseTimestampsSchema);

const scopeSummarySchema = z
	.object({
		id: z.string(),
		collections: z.number(),
		pubs: z.number(),
		discussions: z.number(),
		reviews: z.number(),
		submissions: z.number(),
	})
	.merge(baseTimestampsSchema);

const collectionMetadataSchema = z.object({
	doi: z.string().nullish(),
	issue: z.string().nullish(),
	volume: z.string().nullish(),
	electronicIssn: z.string().nullish(),
	url: z.string().nullish(),
	publicationDate: z.string().nullish(),
});
const memberPermissions = ["view", "edit", "manage", "admin"] as const;

const memberSchema = z.object({
	id: z.string().uuid(),
	permissions: z.enum(memberPermissions).default("view"),
	isOwner: z.boolean().nullable(),
	subscribedToActivityDigest: z.boolean().default(false),
	userId: z.string().uuid(),
	user: baseUserSchema,
});

const textAligns = ["left", "center"] as const;

const pubPreviewTypes = ["minimal", "small", "medium", "large"] as const;

const layoutBlockBannerSchema = z.object({
	type: z.literal("banner"),
	id: z.string(),
	content: z.object({
		align: z.enum(["left", "center"]).optional(),
		backgroundColor: z.string().optional(),
		backgroundHeight: z.enum(["tall", "narrow"]).optional(),
		backgroundImage: z.string().nullish(),
		backgroundSize: z.enum(["full", "standard"]).optional(),
		buttonText: z.string().optional(),
		buttonType: z.enum(["none", "link", "signup", "create-pub"]).optional(),
		buttonUrl: z.string().optional(),
		showButton: z.boolean().optional(),
		text: z.string().optional(),
		defaultCollectionIds: z.array(z.string().uuid()).optional(),
	}),
});

const layoutBlockCollectionPagesSchema = z.object({
	type: z.literal("collections-pages"),
	id: z.string(),
	content: z.object({
		items: z.array(
			z
				.object({
					// for some reason this is not always defined
					type: z.enum(["collection", "page"]).optional(),
					id: z.string().uuid(),
				})
				.or(
					z.object({
						id: z.string().uuid(),
						createdAt: z.string(),
						isPublic: z.boolean(),
						title: z.string(),
					})
				)
		),
		title: z.string().optional(),
		justify: z.enum(["left", "center", "space-between", "space-around"]).optional(),
	}),
});

const layoutBlockHtmlSchema = z.object({
	type: z.literal("html"),
	id: z.string(),
	content: z.object({
		html: z.string().optional(),
	}),
});

const pubSortOrders = [
	"creation-date",
	"creation-date-reversed",
	"publish-date",
	"publish-date-reversed",
	"collection-rank",
] as const;

// common schemas
const scopeSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("root"),
	}),
	z.object({
		kind: z.literal("community"),
		id: z.string().uuid(),
	}),
	z.object({
		kind: z.literal("collection"),
		id: z.string().uuid(),
	}),
	z.object({
		kind: z.literal("pub"),
		id: z.string().uuid(),
	}),
]);

const sourceSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
	z.object({
		scope: scopeSchema,
		value: valueSchema.nullable(),
		facetBindingId: z.string().uuid().nullable(),
	});

// citation style schemas
const citationStyleSchema = z.object({
	citationStyle: z.object({
		sources: z.array(sourceSchema(z.string())),
		value: z.string(),
	}),
	inlineCitationStyle: z.object({
		sources: z.array(sourceSchema(z.string())),
		value: z.string(),
	}),
});

const citationStyleValueSchema = z.object({
	citationStyle: z.string(),
	inlineCitationStyle: z.string(),
});

// license schemas
const copyrightSelectionSchema = z.object({
	choice: z.enum(["infer-from-scope"]),
	year: z.number().nullable(),
});

const licenseSchema = z.object({
	kind: z.object({
		sources: z.array(sourceSchema(z.string())),
		value: z.string(),
	}),
	copyrightSelection: z.object({
		sources: z.array(sourceSchema(copyrightSelectionSchema)),
		value: copyrightSelectionSchema,
	}),
});

const licenseValueSchema = z.object({
	kind: z.string(),
	copyrightSelection: copyrightSelectionSchema,
});

// node labels schemas
const nodeLabelItemSchema = z.object({
	enabled: z.boolean(),
	text: z.string(),
});

const nodeLabelsSchema = z.object({
	image: z.object({
		sources: z.array(sourceSchema(nodeLabelItemSchema)),
		value: nodeLabelItemSchema,
	}),
	video: z.object({
		sources: z.array(sourceSchema(nodeLabelItemSchema)),
		value: nodeLabelItemSchema,
	}),
	audio: z.object({
		sources: z.array(sourceSchema(nodeLabelItemSchema)),
		value: nodeLabelItemSchema,
	}),
	table: z.object({
		sources: z.array(sourceSchema(nodeLabelItemSchema)),
		value: nodeLabelItemSchema,
	}),
	math: z.object({
		sources: z.array(sourceSchema(nodeLabelItemSchema)),
		value: nodeLabelItemSchema,
	}),
	iframe: z.object({
		sources: z.array(sourceSchema(nodeLabelItemSchema)),
		value: nodeLabelItemSchema,
	}),
});

const nodeLabelsValueSchema = z.object({
	image: nodeLabelItemSchema,
	video: nodeLabelItemSchema,
	audio: nodeLabelItemSchema,
	table: nodeLabelItemSchema,
	math: nodeLabelItemSchema,
	iframe: nodeLabelItemSchema,
});

// pub edge display schemas
const pubEdgeDisplaySchema = z.object({
	defaultsToCarousel: z.object({
		sources: z.array(sourceSchema(z.boolean())),
		value: z.boolean(),
	}),
	descriptionIsVisible: z.object({
		sources: z.array(sourceSchema(z.boolean())),
		value: z.boolean(),
	}),
});

const pubEdgeDisplayValueSchema = z.object({
	defaultsToCarousel: z.boolean(),
	descriptionIsVisible: z.boolean(),
});

// pub header theme schemas
const pubHeaderThemeSchema = z.object({
	backgroundImage: z.object({
		sources: z.array(sourceSchema(z.string().nullable())),
		value: z.string().nullable(),
	}),
	backgroundColor: z.object({
		sources: z.array(sourceSchema(z.string())),
		value: z.string(),
	}),
	textStyle: z.object({
		sources: z.array(sourceSchema(z.string())),
		value: z.string(),
	}),
});

const pubHeaderThemeValueSchema = z.object({
	backgroundImage: z.string().nullable(),
	backgroundColor: z.string(),
	textStyle: z.string(),
});

// facet stack item schemas
const createFacetStackItemSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
	z.object({
		scope: scopeSchema,
		value: valueSchema,
		facetBindingId: z.string().uuid(),
	});

// main facets schema
const facetsSchema = z.object({
	CitationStyle: z.object({
		props: citationStyleSchema,
		value: citationStyleValueSchema,
		stack: z.array(createFacetStackItemSchema(citationStyleValueSchema)),
	}),
	License: z.object({
		props: licenseSchema,
		value: licenseValueSchema,
		stack: z.array(
			createFacetStackItemSchema(
				z.object({
					kind: z.string().nullable(),
					copyrightSelection: copyrightSelectionSchema.nullable(),
				})
			)
		),
	}),
	NodeLabels: z.object({
		props: nodeLabelsSchema,
		value: nodeLabelsValueSchema,
		stack: z.array(createFacetStackItemSchema(nodeLabelsValueSchema)),
	}),
	PubEdgeDisplay: z.object({
		props: pubEdgeDisplaySchema,
		value: pubEdgeDisplayValueSchema,
		stack: z.array(
			createFacetStackItemSchema(
				z.object({
					defaultsToCarousel: z.boolean().nullable(),
					descriptionIsVisible: z.boolean().nullable(),
				})
			)
		),
	}),
	PubHeaderTheme: z.object({
		props: pubHeaderThemeSchema,
		value: pubHeaderThemeValueSchema,
		stack: z.array(createFacetStackItemSchema(pubHeaderThemeValueSchema)),
	}),
});

// type definition for TypeScript usage
export type Facets = z.infer<typeof facetsSchema>;

const layoutBlockPubsSchema = z.object({
	type: z.literal("pubs"),
	id: z.string(),
	content: z.object({
		collectionIds: z.array(z.string()).optional(),
		hideByline: z.boolean().optional(),
		hideContributors: z.boolean().optional(),
		hideDates: z.boolean().optional(),
		hideDescription: z.boolean().optional(),
		hideEdges: z.boolean().optional(),
		limit: z.number().optional(),
		pubIds: z.array(z.string()).optional(),
		pubPreviewType: z.enum(pubPreviewTypes),
		sort: z.enum(pubSortOrders).optional(),
		title: z.string().optional(),
	}),
});

const layoutBlockTextSchema = z.object({
	type: z.literal("text"),
	id: z.string(),
	content: z.object({
		text: docJsonSchema.optional(),
		align: z.enum(textAligns).optional(),
	}),
});

const layoutBlockCollectionHeaderSchema = z.object({
	type: z.literal("collection-header"),
	id: z.string(),
	content: z.object({
		hideByline: z.boolean().optional(),
		hideContributors: z.boolean().optional(),
		hideDate: z.boolean().optional(),
		hideDoi: z.boolean().optional(),
		hideCollectionKey: z.boolean().optional(),
		hiddenMetadataFields: z.array(z.string()).optional(),
	}),
});

const layoutBlockSubmissionBannerSchema = z.object({
	type: z.literal("submission-banner"),
	id: z.string(),
	content: z.object({
		title: z.string(),
		body: docJsonSchema,
		submissionWorkflowId: z.string(),
	}),
});

const layoutBlockSchema = z.discriminatedUnion("type", [
	layoutBlockBannerSchema,
	layoutBlockCollectionPagesSchema,
	layoutBlockHtmlSchema,
	layoutBlockPubsSchema,
	layoutBlockTextSchema,
	layoutBlockCollectionHeaderSchema,
	layoutBlockSubmissionBannerSchema,
]);

const pageSchema = z
	.object({
		id: z.string(),
		title: z.string(),
		slug: z.string(),
		description: z.string().nullable(),
		avatar: z.string().url().nullable(),
		isPublic: z.boolean().default(false),
		isNarrowWidth: z.boolean().nullable(),
		viewHash: z.string().nullable(),
		layout: z.array(layoutBlockSchema),
		layoutAllowsDuplicatePubs: z.boolean().default(false),
		communityId: z.string().uuid(),
	})
	.merge(baseTimestampsSchema);

const collectionPubSchema = z
	.object({
		id: z.string(),
		pubId: z.string(),
		collectionId: z.string(),
		contextHint: z.string().nullable(),
		rank: z.string(),
		pubRank: z.string(),
	})
	.merge(baseTimestampsSchema);

const collectionSchema = z
	.discriminatedUnion("kind", [
		z.object({
			kind: z.literal("issue"),
			metadata: z.object({
				doi: z.string().nullish(),
				issue: z.string().nullish(),
				volume: z.string().nullish(),
				electronicIssn: z.string().nullish(),
				url: z.string().nullish(),
				publicationDate: z.string().nullish(),
			}),
		}),
		z.object({
			kind: z.literal("book"),
			metadata: z.object({
				edition: z.string().nullish(),
				copyrightYear: z.string().nullish(),
			}),
		}),
		z.object({
			kind: z.literal("conference-proceedings"),
			metadata: z.object({
				theme: z.string().nullish(),
				acronym: z.string().nullish(),
				location: z.string().nullish(),
				date: z.string().nullish(),
			}),
		}),
		z.object({
			kind: z.literal("tag"),
			metadata: z.object({}).nullish(),
		}),
	])
	.and(
		z
			.object({
				id: z.string(),
				title: z.string(),
				slug: z.string(),
				avatar: z.string().nullable(),
				isRestricted: z.boolean(),
				isPublic: z.boolean(),
				viewHash: z.string(),
				editHash: z.string(),
				doi: z.string().nullable(),
				readNextPreviewSize: z.string(),
				layout: z.object({
					blocks: layoutBlockSchema.array(),
					isNarrow: z.boolean(),
				}),
				layoutAllowsDuplicatePubs: z.boolean(),
				pageId: z.string().nullable(),
				communityId: z.string(),
				scopeSummaryId: z.string().nullable(),
				scopeSummary: scopeSummarySchema.nullish(),
				crossrefDepositRecordId: z.string().nullable(),
				page: pageSchema.nullish(),
				members: z.array(memberSchema),
				attributions: z.array(attributionSchema),
				collectionPubs: z.array(collectionPubSchema),
				facets: facetsSchema,
			})
			.merge(baseTimestampsSchema)
	);

export type LegacyCollection = z.infer<typeof collectionSchema>;

export const relationTypes = [
	"comment",
	"commentary",
	"preprint",
	"rejoinder",
	"reply",
	"review",
	"supplement",
	"translation",
	"version",
] as const;

export type PubEdge = {
	id: string;
	pubId: string;
	relationType: (typeof relationTypes)[number];
	rank: string;
	pubIsParent: boolean;
	approvedByTarget: boolean;
} & (
	| {
			targetPubId: string;
			targetPub: LegacyPub;
			externalPublication: null;
			externalPublicationId: null;
	  }
	| {
			targetPubId: null;
			targetPub: null;
			externalPublication: z.infer<typeof externalPublicationSchema>;
			externalPublicationId: string;
	  }
);

export const pubEdgeSchema = z.lazy(() =>
	z
		.object({
			id: z.string().uuid(),
			pubId: z.string().uuid(),
			relationType: z.enum(relationTypes),
			rank: z.string(),
			pubIsParent: z.boolean(),
			approvedByTarget: z.boolean(),
		})
		.and(
			z.discriminatedUnion("targetPubId", [
				z.object({
					targetPubId: z.string().uuid().nullable(),
					targetPub: pubSchema,
					externalPublication: z.null(),
					externalPublicationId: z.null(),
				}),
				z.object({
					targetPubId: z.null(),
					targetPub: z.null(),
					externalPublication: externalPublicationSchema,
					externalPublicationId: z.string().uuid(),
				}),
			])
		)
) as z.ZodType<PubEdge>;

export const externalPublicationSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	url: z.string().url(),
	contributors: z.array(z.string()).nullable(),
	doi: z.string().nullable(),
	description: z.string().nullable(),
	avatar: z.string().nullable(),
	publicationDate: z.string().nullable(),
});

export const releaseSchema = z
	.object({
		id: z.string().uuid(),
		noteContent: docJsonSchema.nullable(),
		noteText: z.string().nullable(),
		pubId: z.string().uuid(),
		userId: z.string().uuid(),
		docId: z.string().uuid(),
		historyKey: z.number().int().min(-1),
		historyKeyMissing: z.boolean(),
		doc: docJsonSchema.nullish(),
	})
	.merge(baseTimestampsSchema);

export const pubSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		title: z.string(),
		htmlTitle: z.string().nullable(),
		description: z.string().nullable(),
		htmlDescription: z.string().nullable(),
		avatar: z.string().nullable(),
		customPublishedAt: z.string().nullable(),
		doi: z.string().nullable(),
		labels: z.any().nullable(),
		downloads: z.array(downloadSchema),
		metadata: z.any().nullable(),
		viewHash: z.string(),
		editHash: z.string(),
		reviewHash: z.string(),
		commentHash: z.string(),
		draftId: z.string(),
		communityId: z.string(),
		crossrefDepositRecordId: z.string().nullable(),
		scopeSummaryId: z.string(),
		members: z.array(z.any()),
		draft: draftSchema,
		submission: z.any().nullable(),
		crossrefDepositRecord: z.any().nullable(),
		scopeSummary: scopeSummarySchema,
		attributions: z.array(attributionSchema),
		releases: z.array(releaseSchema),
		discussions: z.array(z.any()),
		reviews: z.array(z.any()),
		outboundEdges: z.array(pubEdgeSchema),
		exports: z.array(exportSchema),
		inboundEdges: z.array(pubEdgeSchema),
		collectionPubs: z.array(collectionPubSchema),
		facets: facetsSchema,
	})
	.merge(baseTimestampsSchema);

const communityHeaderLinkSchema = z.object({
	title: z.string(),
	url: z.string(),
	external: z.boolean().optional(),
});

const communityHeroButtonSchema = z.object({
	title: z.string(),
	url: z.string(),
});

const communityNavigationChildSchema = z.union([
	z.object({
		id: z.string(),
		type: z.enum(["page", "collection"]),
	}),
	z.object({
		id: z.string(),
		title: z.string(),
		href: z.string(),
	}),
]);

const communityNavigationMenuSchema = z.object({
	id: z.string(),
	title: z.string(),
	children: z.array(communityNavigationChildSchema),
});

const communityNavigationEntrySchema = z.union([
	communityNavigationChildSchema,
	communityNavigationMenuSchema,
]);

const googleAnalyticsCredentialsSchema = z.object({
	type: z.literal("google-analytics"),
	credentials: z.string().regex(/^G-[A-Z0-9]+$/),
});

const simpleAnalyticsCredentialsSchema = z.object({
	type: z.literal("simple-analytics"),
	credentials: z.null(),
});

/**
 * Schema for analytics settings.
 *
 * `null` means only our own analytics are enabled.
 */
const analyticsSettingsSchema = z
	.discriminatedUnion("type", [
		googleAnalyticsCredentialsSchema,
		simpleAnalyticsCredentialsSchema,
	])
	.nullable()
	.default(null);

const communitySchema = z
	.object({
		id: z.string().uuid(),
		subdomain: z
			.string()
			.min(1)
			.max(280)
			.regex(/^[a-zA-Z0-9-]+$/),
		domain: z.string().nullish(),
		title: z.string(),
		citeAs: z.string().nullish(),
		publishAs: z.string().nullish(),
		description: z.string().max(280).nullish(),
		avatar: z.string().nullish(),
		favicon: z.string().nullish(),
		accentColorLight: z.string(),
		accentColorDark: z.string(),
		hideCreatePubButton: z.boolean().nullish(),
		headerLogo: z.string().nullish(),
		headerLinks: z.array(communityHeaderLinkSchema).nullish(),
		headerColorType: z.enum(["light", "dark", "custom"]).nullish(),
		useHeaderTextAccent: z.boolean().nullish(),
		hideHero: z.boolean().nullish(),
		hideHeaderLogo: z.boolean().nullish(),
		heroLogo: z.string().nullish(),
		heroBackgroundImage: z.string().nullish(),
		heroBackgroundColor: z.string().nullish(),
		heroTextColor: z.string().nullish(),
		useHeaderGradient: z.boolean().nullish(),
		heroImage: z.string().nullish(),
		heroTitle: z.string().nullish(),
		heroText: z.string().nullish(),
		heroPrimaryButton: communityHeroButtonSchema.nullish(),
		heroSecondaryButton: communityHeroButtonSchema.nullish(),
		heroAlign: z.string().nullish(),
		navigation: z.array(communityNavigationEntrySchema).nullish(),
		hideNav: z.boolean().nullish(),
		navLinks: z.array(communityNavigationEntrySchema).nullish(),
		footerLinks: z.array(communityNavigationEntrySchema).nullish(),
		footerLogoLink: z.string().nullish(),
		footerTitle: z.string().nullish(),
		footerImage: z.string().nullish(),
		website: z.string().nullish(),
		facebook: z.string().nullish(),
		twitter: z.string().nullish(),
		instagram: z.string().nullish(),
		mastodon: z.string().nullish(),
		linkedin: z.string().nullish(),
		bluesky: z.string().nullish(),
		github: z.string().nullish(),
		email: z.string().nullish(),
		socialLinksLocation: z.enum(["header", "footer"]).nullish(),
		issn: z.string().nullish(),
		isFeatured: z.boolean().nullish(),
		viewHash: z.string().nullish(),
		editHash: z.string().nullish(),
		premiumLicenseFlag: z.boolean().nullish().default(false),
		defaultPubCollections: z.array(z.string()).nullish(),
		spamTagId: z.string().uuid().nullish(),
		organizationId: z.string().uuid().nullish(),
		scopeSummaryId: z.string().uuid().nullish(),
		scopeSummary: scopeSummarySchema.nullish(),
		accentTextColor: z.string().nullish(),
		analyticsSettings: analyticsSettingsSchema,
		facets: facetsSchema,
	})
	.merge(baseTimestampsSchema);

export const legacyExportSchema = z.object({
	community: communitySchema.extend({
		members: z.array(memberSchema),
	}),
	collections: z.array(collectionSchema),
	pages: z.array(pageSchema),
	// probably a good idea to just not parse the pubs, it might be too much
	pubs: z.custom<LegacyPub[]>(),
});

export type LegacyPub = z.infer<typeof pubSchema>;
export type LegacyPage = z.infer<typeof pageSchema>;

export type LegacyCommunity = z.infer<typeof legacyExportSchema>;
