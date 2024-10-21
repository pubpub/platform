import type { CommunitiesId, PubsId, UsersId } from "db/public";
import {
	Action,
	CoreSchemaType,
	ElementType,
	InputComponent,
	MemberRole,
	StructuralFormElement,
} from "db/public";

import { seedCommunity } from "../seed/seedCommunity";
import { getPubText, pubBodyHTML } from "./fixtures/arcadia";

export const arcadiaSeed = (communityId?: CommunitiesId) =>
	seedCommunity(
		{
			community: {
				id: communityId,
				slug: "arcadia-research",
				name: "Arcadia Research",
				avatar: "https://avatars.githubusercontent.com/u/100431031?s=200&v=4",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.RichText },
				Slug: { schemaName: CoreSchemaType.String },
				"Publication Date": { schemaName: CoreSchemaType.DateTime },
				"Creation Date": { schemaName: CoreSchemaType.DateTime },
				"Last Edited": { schemaName: CoreSchemaType.DateTime },
				// should be fileupload
				Avatar: { schemaName: CoreSchemaType.String },
				Description: { schemaName: CoreSchemaType.RichText },
				Abstract: { schemaName: CoreSchemaType.RichText },
				License: { schemaName: CoreSchemaType.String },
				PubContent: { schemaName: CoreSchemaType.ContextString },
				DOI: { schemaName: CoreSchemaType.URL },
				"Some Relation": {
					schemaName: CoreSchemaType.String,
					relation: true,
				},
				"PDF Download Displayname": { schemaName: CoreSchemaType.String },
				"PDF Download": { schemaName: CoreSchemaType.FileUpload },
				"Pub Image": { schemaName: CoreSchemaType.FileUpload },
				// a contributor is a relation to an Author
				Contributor: {
					schemaName: CoreSchemaType.String,
					relation: true,
					//TODO: when we have typed relations, add pubType: Author here
				},
				Name: { schemaName: CoreSchemaType.String },
				ORCiD: { schemaName: CoreSchemaType.URL },
				Affiliation: { schemaName: CoreSchemaType.String },
				Year: { schemaName: CoreSchemaType.String },
				"Book Reference": { schemaName: CoreSchemaType.Null, relation: true },
				"Book Citation": { schemaName: CoreSchemaType.Null, relation: true },
				"Page Range": { schemaName: CoreSchemaType.StringArray },
				CSV: { schemaName: CoreSchemaType.FileUpload },
				"Issue Article": { schemaName: CoreSchemaType.Null, relation: true },
				"Issue Volume": { schemaName: CoreSchemaType.String },
				"Issue Number": { schemaName: CoreSchemaType.Number },
				Tag: { schemaName: CoreSchemaType.Null, relation: true },
				ISSN: { schemaName: CoreSchemaType.String },
				Issues: { schemaName: CoreSchemaType.Null, relation: true },
				Articles: { schemaName: CoreSchemaType.Null, relation: true },
				Journals: { schemaName: CoreSchemaType.Null, relation: true },
				Editors: { schemaName: CoreSchemaType.Null, relation: true },
				// site settings

				Header: { schemaName: CoreSchemaType.Null, relation: true },
				// Banner
				Banner: { schemaName: CoreSchemaType.Null, relation: true },
				Logo: { schemaName: CoreSchemaType.FileUpload },
				"Background Image": { schemaName: CoreSchemaType.FileUpload },
				"Hide Site Header Logo on Homepage": { schemaName: CoreSchemaType.Boolean },
				"Background Color": { schemaName: CoreSchemaType.String },
				"Text Color": { schemaName: CoreSchemaType.String },
				Align: { schemaName: CoreSchemaType.String },
				"Banner Buttons": { schemaName: CoreSchemaType.Null, relation: true },

				Footer: { schemaName: CoreSchemaType.Null, relation: true },

				// Facets
				"Citation Style": { schemaName: CoreSchemaType.String },
				"Copyright Year": { schemaName: CoreSchemaType.String },
				"Inline Citation Style": { schemaName: CoreSchemaType.String },
				"Pub Header Background Image": { schemaName: CoreSchemaType.FileUpload },
				"Pub Header Background Color": { schemaName: CoreSchemaType.String },
				"Pub Header Text Style": { schemaName: CoreSchemaType.String },

				Navigation: { schemaName: CoreSchemaType.Null, relation: true },
				"Navigation Items": { schemaName: CoreSchemaType.Null, relation: true },

				"External Link": { schemaName: CoreSchemaType.URL },
				"Open In New Tab": { schemaName: CoreSchemaType.Boolean },
				Pages: { schemaName: CoreSchemaType.Null, relation: true },
				Width: { schemaName: CoreSchemaType.String },
				Privacy: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				Tag: {
					Title: true,
				},
				"Navigation Item": {
					Title: true,
					"External Link": true,
					// nested navigation
					"Navigation Item": true,
				},
				Navigation: {
					"Navigation Items": true,
				},
				"Banner Button": {
					Title: true,
					"External Link": true,
				},
				Banner: {
					Title: true,
					Description: true,
					"Text Color": true,
					"Background Color": true,
					"Background Image": true,
					Logo: true,
					"External Link": true,
					Align: true,
					"Banner Buttons": true,
				},
				Header: {
					Logo: true,
					"Background Color": true,
					"Text Color": true,
					// header has a banner
					Banner: true,
					// header has navigation
					Navigation: true,
				},
				Page: {
					Title: true,
					Slug: true,
					Avatar: true,
					Description: true,
					Width: true,
					Privacy: true,
					PubContent: true,
				},
				Footer: {
					Title: true,
					"Text Color": true,
					"Background Color": true,
					"Background Image": true,
					Logo: true,
					"External Link": true,
					Navigation: true,
				},
				Site: {
					Title: true,
					Pages: true,
					Journals: true,
					Header: true,
				},
				Journal: {
					Title: true,
					Description: true,
					Slug: true,
					ISSN: true,
					DOI: true,
					Avatar: true,
					Issues: true,
					Editors: true,
				},
				Issue: {
					Title: true,
					Description: true,
					Slug: true,
					Avatar: true,
					"Last Edited": true,
					"Publication Date": true,
					DOI: true,
					"Issue Article": true,
					Tag: true,
					Contributor: true,
					License: true,
					Articles: true,
					Editors: true,
				},
				"Journal Article": {
					Title: true,
					Slug: true,
					Abstract: true,
					"Last Edited": true,
					"Publication Date": true,
					DOI: true,
					PubContent: true,
					License: true,
					Description: true,
					"Creation Date": true,
					Avatar: true,
					"Some Relation": true,
					Contributor: true,
					"Book Citation": true,
					Tag: true,
					Editors: true,
				},
				"PDF Download": {
					"PDF Download": true,
				},
				"Pub Image": {
					"Pub Image": true,
				},
				Author: {
					Name: true,
					ORCiD: true,
					Affiliation: true,
				},
				Editor: {
					Name: true,
					ORCiD: true,
					Affiliation: true,
				},
				Book: {
					Title: true,
					Year: true,
				},
				BookCitation: {
					"Book Reference": true,
					"Page Range": true,
					haths: false,
				},
				Table: {
					CSV: true,
				},
			},

			pubs: {
				"Header Navigation": {
					pubType: "Navigation",
					values: {},
					children: {
						"Home Link": {
							pubType: "Navigation Item",
							values: {
								Title: "Home",
								"External Link": "https://arcadia-research.pubpub.org",
							},
						},
					},
				},
				"Footer Navigation": {
					pubType: "Navigation",
					values: {},
					children: {
						"Home Link": {
							pubType: "Navigation Item",
							values: {
								Title: "Legal",
								"External Link": "https://arcadia-research.pubpub.org/legal",
							},
						},
					},
				},
				Header: {
					pubType: "Header",
					values: {
						"Background Color": "#000000",
						"Text Color": "#ffffff",
					},
				},
				Site: {
					pubType: "Site",
					values: {
						Title: "Arcadia Research",
					},
				},
				"A Journal Article": {
					pubType: "Journal Article",
					stage: "Stage 1",
					values: {
						Title: "Identification of capsid-like proteins in venomous and parasitic animals",
						"Publication Date": new Date(),
						"Creation Date": new Date(),
						"Last Edited": new Date(),
						Avatar: "https://assets.pubpub.org/yhsu8e81/Arcadia_Pub type_Preview_Result (1)-71721329283073.png",
						Description:
							"Inspired by wasps co-opting viral capsids to deliver genes to the caterpillars they parasitize, we looked for capsid-like proteins in other species. We found capsid homologs in ticks and other parasites, suggesting this phenomenon could be wider spread than previously known.",
						Abstract: `<p id="n33ucq2qaha">The development of AAV capsids for therapeutic gene delivery has exploded in popularity over the past few years. However, humans aren’t the first or only species using viral capsids for gene delivery — wasps evolved this tactic over 100 million years ago. Parasitoid wasps that lay eggs inside arthropod hosts have co-opted ancient viruses for gene delivery to manipulate multiple aspects of the host’s biology, thereby increasing the probability of survival of the wasp larvae <span id="n67l65xpyip" data-node-type="citation" data-value="https://doi.org/10.1016/j.virusres.2006.01.001" data-unstructured-value="" data-custom-label="" class="citation" tabindex="0" role="link" aria-describedby="n67l65xpyip-note-popover" contenteditable="false">[1]</span><span id="n2piklt9xg9" data-node-type="citation" data-value="https://doi.org/10.1016/j.tim.2004.10.004" data-unstructured-value="" data-custom-label="" class="citation" tabindex="0" role="link" aria-describedby="n2piklt9xg9-note-popover" contenteditable="false">[2]</span>.&nbsp;</p>`,
						License: "CC BY 4.0",
						PubContent: {
							html: "", //pubBodyHTML,
							data: {}, //getPubText,
						},
						DOI: "https://doi.org/10.57844/arcadia-14b2-6f27",
					},
					children: {
						"PDF Download 1": {
							pubType: "PDF Download",
							values: {
								// "PDF Download": [
								// 	{
								// 		fileMeta: {
								// 			name: "arcadia-14b2-6f27.pdf",
								// 			type: "application/pdf",
								// 			relativePath: "arcadia-14b2-6f27.pdf",
								// 		},
								// 		fileName: "arcdaia-something.pdf",
								// 		fileType: "application/pdf",
								// 		fileSize: 400,
								// 		fileSource: "https://some-source.com",
								// 		fileUploadUrl: "https://some-source.com/arcdaia-something.pdf",
								// 		id: "xxxx-xxxx-xxxx",
								// 	},
								// ],
							},
						},
						"Image 1": {
							pubType: "Pub Image",
							// TODO: fill in values
							values: {},
						},
						"Table 1": {
							pubType: "Table",
							values: {
								//
							},
						},
						"Table 2": {
							pubType: "Table",
							values: {
								CSV: [],
								//
							},
						},
					},
				},

				James: {
					pubType: "Author",
					values: {
						Name: "James McJimothy",
						ORCiD: "https://orcid.org/0000-0000-0000-0000",
						Affiliation: "University of Somewhere",
					},
				},
				Book: {
					pubType: "Book",
					values: {
						Title: "A Book",
						Year: "2022",
					},
				},
				BookCite: {
					pubType: "BookCitation",
					values: {
						"Page Range": ["33", "44"],
					},
				},
			},

			forms: {},

			users: {
				"arcadia-user-1": {},
			},

			stages: {
				"Stage 1": {
					members: ["arcadia-user-1"],
				},
				"Stage 2": {
					members: ["arcadia-user-1"],
				},
			},

			stageConnections: {
				"Stage 1": {
					to: ["Stage 2"],
				},
			},

			pubRelations: {
				BookCite: {
					"Book Reference": ["Book"],
				},
				"A Journal Article": {
					Contributor: ["James"],
					"Book Citation": ["BookCite"],
				},
			},
		},
		{
			randomSlug: false,
		}
	);
