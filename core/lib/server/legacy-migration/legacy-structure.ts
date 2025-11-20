import { CoreSchemaType } from "db/public"

export const REQUIRED_LEGACY_PUB_FIELDS = {
	Title: { schemaName: CoreSchemaType.String },
	Slug: { schemaName: CoreSchemaType.String },
	"Publication Date": { schemaName: CoreSchemaType.DateTime },
	"Creation Date": { schemaName: CoreSchemaType.DateTime },
	"Last Edited": { schemaName: CoreSchemaType.DateTime },
	// should be fileupload
	Avatar: { schemaName: CoreSchemaType.FileUpload },
	Description: { schemaName: CoreSchemaType.String },
	Abstract: { schemaName: CoreSchemaType.RichText },
	License: { schemaName: CoreSchemaType.String },
	PubContent: { schemaName: CoreSchemaType.RichText },
	DOI: { schemaName: CoreSchemaType.URL },
	"DOI Suffix": { schemaName: CoreSchemaType.String },
	URL: { schemaName: CoreSchemaType.URL },
	"PDF Download Displayname": { schemaName: CoreSchemaType.String },
	PDF: { schemaName: CoreSchemaType.FileUpload },
	"Pub Image": { schemaName: CoreSchemaType.FileUpload },

	Caption: { schemaName: CoreSchemaType.String },
	// a contributor is a relation to an Author
	Contributors: {
		// string here acts as a description of the contribution
		schemaName: CoreSchemaType.String,
		relation: true,
	},
	Name: { schemaName: CoreSchemaType.String },
	ORCiD: { schemaName: CoreSchemaType.URL },
	Affiliation: { schemaName: CoreSchemaType.String },
	Year: { schemaName: CoreSchemaType.String },
	CSV: { schemaName: CoreSchemaType.FileUpload },
	Tag: { schemaName: CoreSchemaType.Null, relation: true },
	Editors: { schemaName: CoreSchemaType.Null, relation: true },

	Downloads: { schemaName: CoreSchemaType.String, relation: true },
	Images: { schemaName: CoreSchemaType.Null, relation: true },
	Tables: { schemaName: CoreSchemaType.Null, relation: true },
	Citations: { schemaName: CoreSchemaType.String, relation: true },

	ConnectedPubs: { schemaName: CoreSchemaType.String, relation: true },
	Versions: { schemaName: CoreSchemaType.Number, relation: true },
	Discussions: { schemaName: CoreSchemaType.String, relation: true },
	"Version Number": { schemaName: CoreSchemaType.Number },
	"Full Name": { schemaName: CoreSchemaType.String },

	// page specific
	Layout: { schemaName: CoreSchemaType.RichText },
	"Layout Allows Duplicate Pubs": { schemaName: CoreSchemaType.Boolean },
	"Is Narrow Width": { schemaName: CoreSchemaType.Boolean },

	"Legacy Id": { schemaName: CoreSchemaType.String },
	"Is Public": { schemaName: CoreSchemaType.Boolean },

	// issue
	"Issue Number": { schemaName: CoreSchemaType.String },
	"Issue Volume": { schemaName: CoreSchemaType.String },
	"E-ISSN": { schemaName: CoreSchemaType.String },
	"Print Publication Date": { schemaName: CoreSchemaType.DateTime },

	// book
	ISBN: { schemaName: CoreSchemaType.String },
	Edition: { schemaName: CoreSchemaType.String },
	"Copyright Year": { schemaName: CoreSchemaType.String },

	// conference
	Theme: { schemaName: CoreSchemaType.String },
	Acronym: { schemaName: CoreSchemaType.String },
	Location: { schemaName: CoreSchemaType.String },
	"Held at Date": { schemaName: CoreSchemaType.DateTime },

	// for issues
	Articles: { schemaName: CoreSchemaType.String, relation: true },
	// for books
	Chapters: { schemaName: CoreSchemaType.String, relation: true },
	// for conference proceedings
	Presentations: { schemaName: CoreSchemaType.String, relation: true },
	// for collections
	Items: { schemaName: CoreSchemaType.String, relation: true },

	Page: { schemaName: CoreSchemaType.Null, relation: true },

	Favicon: { schemaName: CoreSchemaType.FileUpload },

	"Header Background Image": { schemaName: CoreSchemaType.FileUpload },
	"Header Text Style": { schemaName: CoreSchemaType.String },
	"Header Theme": { schemaName: CoreSchemaType.Color },

	// journal metadata
	"Cite As": { schemaName: CoreSchemaType.String },
	"Publish As": { schemaName: CoreSchemaType.String },
	"Accent Color Light": { schemaName: CoreSchemaType.Color },
	"Accent Color Dark": { schemaName: CoreSchemaType.Color },
	"Hero Title": { schemaName: CoreSchemaType.String },
	"Hero Text": { schemaName: CoreSchemaType.String },
	"Journal Pages": { schemaName: CoreSchemaType.Null, relation: true },
	"Journal Articles": { schemaName: CoreSchemaType.Null, relation: true },
	"Journal Collections": { schemaName: CoreSchemaType.Null, relation: true },

	"Navigation Targets": { schemaName: CoreSchemaType.Null, relation: true },
	"Navigation Id": { schemaName: CoreSchemaType.String, relation: true },

	Footer: { schemaName: CoreSchemaType.Null, relation: true },
	Header: { schemaName: CoreSchemaType.Null, relation: true },
} as const

export const REQUIRED_LEGACY_PUB_TYPES = {
	"Journal Article": {
		fields: {
			Title: { isTitle: true },
			Avatar: { isTitle: false },
			"Header Background Image": { isTitle: false },
			"Header Text Style": { isTitle: false },
			"Header Theme": { isTitle: false },
			Abstract: { isTitle: false },
			"Legacy Id": { isTitle: false },
			PubContent: { isTitle: false },
			DOI: { isTitle: false },
			Description: { isTitle: false },
			Discussions: { isTitle: false },
			"Publication Date": { isTitle: false },
			Contributors: { isTitle: false },
			URL: { isTitle: false },
			Versions: { isTitle: false },
			Slug: { isTitle: false },
			ConnectedPubs: { isTitle: false },
		},
		description: "A Legacy Journal Article Pub (migrated)",
	},
	Page: {
		fields: {
			Title: { isTitle: true },
			"Legacy Id": { isTitle: false },
			Description: { isTitle: false },
			Slug: { isTitle: false },
			Avatar: { isTitle: false },
			"Is Public": { isTitle: false },
			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },
		},
		description: "A Legacy Page Pub (migrated)",
	},
	Contributor: {
		fields: {
			"Full Name": { isTitle: true },
			Affiliation: { isTitle: false },
		},
		description: "A Contributor (migrated)",
	},
	Version: {
		fields: {
			Abstract: { isTitle: false },
			Description: { isTitle: true },
			PubContent: { isTitle: false },
			"Publication Date": { isTitle: false },
			"Version Number": { isTitle: false },
		},
		description: "A Version of a Pub (migrated)",
	},
	Discussion: {
		fields: {
			"Full Name": { isTitle: true },
			PubContent: { isTitle: false },
			ORCiD: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
		},
		description: "A Discussion on a pub (migrated)",
	},
	Issue: {
		fields: {
			Title: { isTitle: true },
			Description: { isTitle: false },
			"Legacy Id": { isTitle: false },
			Contributors: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Slug: { isTitle: false },
			"Is Public": { isTitle: false },

			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },

			// metadata
			DOI: { isTitle: false },
			URL: { isTitle: false },
			"Issue Number": { isTitle: false },
			"Issue Volume": { isTitle: false },
			"E-ISSN": { isTitle: false },
			"Print Publication Date": { isTitle: false },

			Articles: { isTitle: false },

			Page: { isTitle: false },
		},
		description: "An Issue (migrated)",
	},
	Book: {
		fields: {
			Title: { isTitle: true },
			Description: { isTitle: false },
			"Legacy Id": { isTitle: false },
			Contributors: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Slug: { isTitle: false },
			"Is Public": { isTitle: false },

			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },

			// metadata
			DOI: { isTitle: false },
			URL: { isTitle: false },
			ISBN: { isTitle: false },
			Edition: { isTitle: false },
			"Copyright Year": { isTitle: false },

			Chapters: { isTitle: false },

			Page: { isTitle: false },
		},
		description: "An Issue (migrated)",
	},
	"Conference Proceedings": {
		fields: {
			Title: { isTitle: true },
			Description: { isTitle: false },
			"Legacy Id": { isTitle: false },
			Contributors: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Slug: { isTitle: false },
			"Is Public": { isTitle: false },

			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },

			// metadata
			DOI: { isTitle: false },
			URL: { isTitle: false },

			Theme: { isTitle: false },
			Acronym: { isTitle: false },
			Location: { isTitle: false },
			"Held at Date": { isTitle: false },

			Presentations: { isTitle: false },

			Page: { isTitle: false },
		},
		description: "An Issue (migrated)",
	},
	Collection: {
		fields: {
			Title: { isTitle: true },
			"Legacy Id": { isTitle: false },
			Contributors: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Slug: { isTitle: false },
			"Is Public": { isTitle: false },

			Layout: { isTitle: false },
			"Layout Allows Duplicate Pubs": { isTitle: false },
			"Is Narrow Width": { isTitle: false },

			DOI: { isTitle: false },
			Items: { isTitle: false },
			Page: { isTitle: false },
		},
		description: "An Issue (migrated)",
	},
	// the community basically
	Journal: {
		fields: {
			Title: { isTitle: true },
			Description: { isTitle: false },
			"Legacy Id": { isTitle: false },
			PubContent: { isTitle: false },
			DOI: { isTitle: false },
			Slug: { isTitle: false },
			"Publication Date": { isTitle: false },
			Avatar: { isTitle: false },
			Favicon: { isTitle: false },
			URL: { isTitle: false },
			"E-ISSN": { isTitle: false },
			"Full Name": { isTitle: false },
			Contributors: { isTitle: false },
			"Is Public": { isTitle: false },
			// journal-specific metadata fields
			"Cite As": { isTitle: false },
			"Publish As": { isTitle: false },
			"Accent Color Light": { isTitle: false },
			"Accent Color Dark": { isTitle: false },
			"Hero Title": { isTitle: false },
			"Hero Text": { isTitle: false },
			"Journal Pages": { isTitle: false },
			"Journal Articles": { isTitle: false },
			"Journal Collections": { isTitle: false },
			Footer: { isTitle: false },
			Header: { isTitle: false },
		},
		description: "A PubPub Legacy Journal (migrated)",
	},
	"Navigation Link": {
		fields: {
			"Navigation Id": { isTitle: false },
			Title: { isTitle: true },
			URL: { isTitle: false },
		},
		description: "A Navigation Link for a Journal website (migrated)",
	},
	"Navigation Menu": {
		fields: {
			"Navigation Id": { isTitle: false },
			Title: { isTitle: true },
			"Navigation Targets": {
				isTitle: false,
				defaultFormTargets: [
					"Navigation Link",
					"Page",
					"Collection",
					"Issue",
					"Book",
					"Conference Proceedings",
					"Journal Article",
					"Navigation Menu",
				],
			},
		},
		description: "The navigation menu for a Journal website (migrated)",
	},
	Header: {
		fields: {
			Title: { isTitle: true },
			"Navigation Targets": {
				isTitle: false,
				defaultFormTargets: [
					"Navigation Link",
					"Page",
					"Collection",
					"Issue",
					"Book",
					"Conference Proceedings",
					"Journal Article",
					"Navigation Menu",
				],
			},
		},
		description: "The header for Journal (migrated)",
	},
	Footer: {
		fields: {
			Title: { isTitle: true },
			"Navigation Targets": {
				isTitle: false,
				defaultFormTargets: [
					"Navigation Link",
					"Page",
					"Collection",
					"Issue",
					"Book",
					"Conference Proceedings",
					"Journal Article",
				],
			},
		},
		description: "The footer for a Journal website (migrated)",
	},
} as const satisfies Record<
	string,
	{
		fields: {
			[K in keyof typeof REQUIRED_LEGACY_PUB_FIELDS]?: {
				isTitle: boolean
			} & ("relation" extends keyof (typeof REQUIRED_LEGACY_PUB_FIELDS)[K]
				? {
						defaultFormTargets?: string[] //(keyof typeof REQUIRED_LEGACY_PUB_TYPES)[];
					}
				: {})
		}
		description: string
	}
>
