import type { CommunitiesId, PubsId, UsersId } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import { seedCommunity } from "../seed/seedCommunity";

export const arcadiaSeed = (communityId?: CommunitiesId) => {
	const journalArticleId = crypto.randomUUID() as PubsId;

	return seedCommunity(
		{
			community: {
				id: communityId,
				slug: "arcadia-research",
				name: "Arcadia Research",
				avatar: "https://avatars.githubusercontent.com/u/100431031?s=200&v=4",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Slug: { schemaName: CoreSchemaType.String },
				"Publication Date": { schemaName: CoreSchemaType.DateTime },
				"Creation Date": { schemaName: CoreSchemaType.DateTime },
				"Last Edited": { schemaName: CoreSchemaType.DateTime },
				// should be fileupload
				Avatar: { schemaName: CoreSchemaType.String },
				Description: { schemaName: CoreSchemaType.String },
				Abstract: { schemaName: CoreSchemaType.String },
				License: { schemaName: CoreSchemaType.String },
				PubContent: { schemaName: CoreSchemaType.String },
				DOI: { schemaName: CoreSchemaType.URL },
				"PDF Download Displayname": { schemaName: CoreSchemaType.String },
				PDF: { schemaName: CoreSchemaType.FileUpload },
				"Pub Image": { schemaName: CoreSchemaType.FileUpload },

				Caption: { schemaName: CoreSchemaType.String },
				// a contributor is a relation to an Author
				Contributors: {
					// string here acts as a description of the contribution
					schemaName: CoreSchemaType.String,
					relation: true,
					//TODO: when we have typed relations, add pubType: Author here
				},
				Name: { schemaName: CoreSchemaType.String },
				ORCiD: { schemaName: CoreSchemaType.URL },
				Affiliation: { schemaName: CoreSchemaType.String },
				Year: { schemaName: CoreSchemaType.String },
				CSV: { schemaName: CoreSchemaType.FileUpload },
				Tag: { schemaName: CoreSchemaType.Null, relation: true },
				Editors: { schemaName: CoreSchemaType.Null, relation: true },

				MemberId: { schemaName: CoreSchemaType.String },

				Downloads: { schemaName: CoreSchemaType.String, relation: true },
				Images: { schemaName: CoreSchemaType.Null, relation: true },
				Tables: { schemaName: CoreSchemaType.Null, relation: true },
				Citations: { schemaName: CoreSchemaType.String, relation: true },

				"Issue Article": { schemaName: CoreSchemaType.Null, relation: true },
				"Issue Volume": { schemaName: CoreSchemaType.String },
				"Issue Number": { schemaName: CoreSchemaType.Number },
				ISSN: { schemaName: CoreSchemaType.String },
				Issues: { schemaName: CoreSchemaType.Null, relation: true },
				Articles: { schemaName: CoreSchemaType.Null, relation: true },
				Journals: { schemaName: CoreSchemaType.Null, relation: true },
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
				"Navigation Item": {
					Title: true,
					"External Link": true,
					"Open In New Tab": true,
					// nested navigation
					"Navigation Items": true,
				},
				Navigation: {
					Title: true,
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
					Description: true,
					Slug: true,
					Pages: true,
					Journals: true,
					Header: true,
					Footer: true,
				},
				Tag: {
					Title: true,
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
					Articles: true,
					Description: true,
					DOI: true,
					Downloads: true,
					ISSN: true,
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
					Contributors: true,
					Tag: true,
					Editors: true,
					Downloads: true,
					Images: true,
					Citations: true,
					"Inline Citation Style": true,
					"Citation Style": true,
					Tables: true,
				},
				"PDF Download": {
					PDF: true,
				},
				"Pub Image": {
					"Pub Image": true,
					Caption: true,
				},
				Author: {
					Name: true,
					ORCiD: true,
					Affiliation: true,
					MemberId: true,
				},
				Editor: {
					Name: true,
					ORCiD: true,
					Affiliation: true,
				},
				ExternalBook: {
					Title: true,
					Year: true,
					DOI: true,
					"External Link": true,
				},
				ExternalJournalArticle: {
					Title: true,
					Year: true,
					DOI: true,
					"External Link": true,
				},
				Table: {
					Caption: true,
					CSV: true,
				},
			},
			users: {
				"arcadia-user-1": {
					email: "arcadia@pubpub.org",
					role: MemberRole.admin,
					password: "pubpub-arcadia",
				},
			},
			stages: {
				Articles: {
					members: ["arcadia-user-1"],
				},
				// these stages are mostly here to provide slightly easier grouping of the relevant pubs
				Sites: {},
				Journals: {},
				Issues: {},
				Navigations: {},
				Tags: {},
				"Stage 2": {
					members: ["arcadia-user-1"],
				},
			},
			stageConnections: {
				Articles: {
					to: ["Stage 2"],
				},
			},
			pubs: [
				{
					pubType: "Site",
					stage: "Sites",
					values: {
						Title: "Arcadia Research",
						Description:
							"We’re reimagining scientific publication — welcome to the first draft! Arcadia's research appears here in short pubs and longer project narratives.",
					},
					relatedPubs: {
						Header: [
							{
								value: null,
								alsoAsChild: true,
								pub: {
									pubType: "Header",
									values: {
										"Background Color": "#000000",
										"Text Color": "#ffffff",
									},
									relatedPubs: {
										Banner: [],
										Navigation: [
											{
												value: null,
												alsoAsChild: true,
												pub: {
													pubType: "Navigation",
													stage: "Navigations",
													values: {
														Title: "Header Navigation",
													},
													relatedPubs: {
														"Navigation Items": [
															{
																value: null,
																alsoAsChild: true,
																pub: {
																	pubType: "Navigation Item",
																	values: {
																		Title: "Home",
																		"External Link":
																			"https://arcadia-research.pubpub.org",
																	},
																},
															},
														],
													},
												},
											},
										],
									},
								},
							},
						],
						Footer: [
							{
								value: null,
								alsoAsChild: true,
								pub: {
									pubType: "Footer",
									values: {
										Title: "Website Footer",
										"Background Color": "#000000",
										"Text Color": "#ffffff",
									},
									relatedPubs: {
										Navigation: [
											{
												value: null,
												alsoAsChild: true,
												pub: {
													pubType: "Navigation",
													stage: "Navigations",
													values: { Title: "Footer Navigation" },
													relatedPubs: {
														"Navigation Items": [
															{
																value: null,
																alsoAsChild: true,
																pub: {
																	pubType: "Navigation Item",
																	values: {
																		Title: "Legal",
																		"External Link":
																			"https://arcadia-research.pubpub.org/legal",
																		"Open In New Tab": true,
																	},
																},
															},
														],
													},
												},
											},
										],
									},
								},
							},
						],
						Journals: [
							{
								value: null,
								alsoAsChild: true,
								pub: {
									pubType: "Journal",
									stage: "Journals",
									values: {
										Title: "Arcadia Research",
										DOI: "https://doi.org/10.57844/arcadia-ad7f-7a6d",
										ISSN: "2998-4084",
										Slug: "arcadia-research",
									},
									relatedPubs: {
										Issues: [
											{
												value: null,
												alsoAsChild: true,
												pub: {
													pubType: "Issue",
													stage: "Issues",
													values: {
														Title: "Issue 1",
														ISSN: "2998-4084",
														DOI: "https://doi.org/10.57844/arcadia-ad7f-7a6d",
														Description: "A cool description",
													},
													relatedPubs: {
														Articles: [
															{
																value: null,
																alsoAsChild: true,
																pub: {
																	pubType: "Journal Article",
																	stage: "Articles",
																	values: {
																		Title: "Identification of capsid-like proteins in venomous and parasitic animals",
																		"Publication Date":
																			new Date(),
																		"Creation Date": new Date(),
																		"Last Edited": new Date(),
																		Avatar: "https://assets.pubpub.org/yhsu8e81/Arcadia_Pub type_Preview_Result (1)-71721329283073.png",
																		Description:
																			"Inspired by wasps co-opting viral capsids to deliver genes to the caterpillars they parasitize, we looked for capsid-like proteins in other species. We found capsid homologs in ticks and other parasites, suggesting this phenomenon could be wider spread than previously known.",
																		Abstract: `<p id="n33ucq2qaha">The development of AAV capsids for therapeutic gene delivery has exploded in popularity over the past few years. However, humans aren’t the first or only species using viral capsids for gene delivery — wasps evolved this tactic over 100 million years ago. Parasitoid wasps that lay eggs inside arthropod hosts have co-opted ancient viruses for gene delivery to manipulate multiple aspects of the host’s biology, thereby increasing the probability of survival of the wasp larvae <span id="n67l65xpyip" data-node-type="citation" data-value="https://doi.org/10.1016/j.virusres.2006.01.001" data-unstructured-value="" data-custom-label="" class="citation" tabindex="0" role="link" aria-describedby="n67l65xpyip-note-popover" contenteditable="false">[1]</span><span id="n2piklt9xg9" data-node-type="citation" data-value="https://doi.org/10.1016/j.tim.2004.10.004" data-unstructured-value="" data-custom-label="" class="citation" tabindex="0" role="link" aria-describedby="n2piklt9xg9-note-popover" contenteditable="false">[2]</span>.&nbsp;</p>`,
																		License: "CC-BY 4.0",
																		PubContent: "Some content",
																		DOI: "https://doi.org/10.57844/arcadia-14b2-6f27",
																		"Inline Citation Style":
																			"Author Year",
																		"Citation Style": "APA 7",
																	},

																	// the relevant pubs are implemented as both children
																	// and related pubs for demonstration purposes
																	relatedPubs: {
																		Tag: [
																			{
																				value: null,
																				pub: {
																					stage: "Tags",
																					pubType: "Tag",
																					values: {
																						Title: "Icebox",
																					},
																				},
																			},
																		],
																		Contributors: [
																			{
																				value: "Editing & Draft Preparation",
																				alsoAsChild: true,
																				pub: {
																					pubType:
																						"Author",
																					values: {
																						Name: "James McJimothy",
																						ORCiD: "https://orcid.org/0000-0000-0000-0000",
																						Affiliation:
																							"University of Somewhere",
																					},
																				},
																			},
																		],
																		Downloads: [
																			{
																				// acting as a description of the download
																				value: "PDF Download",
																				alsoAsChild: true,
																				pub: {
																					pubType:
																						"PDF Download",
																					// can't really add the actual file here
																					values: {},
																				},
																			},
																		],
																		Tables: [
																			{
																				value: null,
																				alsoAsChild: true,
																				pub: {
																					pubType:
																						"Table",
																					values: {
																						Caption:
																							"A beautiful table, about things.",
																						CSV: [],
																					},
																				},
																			},
																			{
																				value: null,
																				alsoAsChild: true,
																				pub: {
																					pubType:
																						"Table",
																					values: {
																						Caption:
																							"A table, about things.",
																						CSV: [],
																					},
																				},
																			},
																		],
																		Images: [
																			{
																				value: null,
																				alsoAsChild: true,
																				pub: {
																					pubType:
																						"Pub Image",
																					values: {
																						Caption:
																							"A beautiful image, about things.",
																					},
																				},
																			},
																		],
																		Citations: [
																			{
																				value: "Chapter 5",
																				alsoAsChild: true,
																				pub: {
																					pubType:
																						"ExternalBook",
																					values: {
																						Title: "A Great Book",
																						DOI: "https://doi.org/10.57844/arcadia-ad7f-7a6d",
																						Year: "2022",
																					},
																				},
																			},
																			{
																				value: "pp. 35-53",
																				alsoAsChild: true,
																				pub: {
																					pubType:
																						"ExternalJournalArticle",
																					values: {
																						Title: "A Great Journal Article",
																						DOI: "https://doi.org/10.57844/arcadia-ad7f-7a6d",
																						Year: "2022",
																					},
																				},
																			},
																		],
																	},
																},
															},
														],
													},
												},
											},
										],
									},
								},
							},
						],
					},
				},
			],
			forms: {},
		},
		{
			randomSlug: false,
		}
	);
};
