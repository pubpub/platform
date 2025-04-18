/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
	"/activities": {
		/** Get a JSON API result of activities. */
		get: {
			parameters: {
				query?: {
					/** @description Find activity by an id. */
					id?: string;
					/** @description Find activities by array of activity ids */
					ids?: string[];
					/** @description Search the index by keyword or query string syntax. */
					query?: string;
					/** @description Pagination - page number */
					"page[number]"?: number;
					/** @description Pagination - page size */
					"page[size]"?: number;
					/** @description Pagination - page cursor (used instead of page[number]) */
					"page[cursor]"?: string;
				};
			};
			responses: {
				/** @description A JSON API result of activities. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Activity"];
					};
				};
			};
		};
	};
	"/activities/{id}": {
		/** Get a JSON API result of a specific activity. */
		get: {
			parameters: {
				path: {
					/** @description Activity ID */
					id: string;
				};
			};
			responses: {
				/** @description A JSON object. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Activity"];
					};
				};
			};
		};
	};
	"/client-prefixes": {
		/** Return a list of client-prefixes. */
		get: {
			parameters: {
				query?: {
					query?: string;
					year?: number;
					"client-id"?: string;
					"prefix-id"?: string;
					"page[number]"?: number;
					sort?: "name" | "-name" | "created" | "-created";
				};
			};
			responses: {
				/** @description A JSON array of client-prefixes. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["ClientPrefix"];
					};
				};
			};
		};
	};
	"/clients": {
		/** Return a list of clients (repositories). */
		get: {
			parameters: {
				query?: {
					query?: string;
					/** @description The year the client was created. */
					year?: number;
					"provider-id"?: string;
					software?:
						| "ckan"
						| "dataverse"
						| "dspace"
						| "eprints"
						| "fedora"
						| "invenio"
						| "islandora"
						| "nesstar"
						| "open journal systems (ojs)"
						| "opus"
						| "samvera"
						| "pubman"
						| "mycore"
						| "other"
						| "unknown";
					"client-type"?: "repository" | "periodical";
					"repository-type"?:
						| "disciplinary"
						| "governmental"
						| "institutional"
						| "multidisciplinary"
						| "project-related"
						| "other";
					certificate?:
						| "CLARIN"
						| "CoreTrustSeal"
						| "DIN 31644"
						| "DINI"
						| "DSA"
						| "RatSWD"
						| "WDS";
					"page[number]"?: number;
					"page[size]"?: number;
					include?: "provider" | "repository";
					sort?: "relevance" | "name" | "-name" | "created" | "-created";
				};
			};
			responses: {
				/** @description A JSON array of clients. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Client"];
					};
				};
			};
		};
	};
	"/clients/totals": {
		/** Return clients DOI production statistics. */
		get: {
			parameters: {
				query?: {
					"provider-id"?: string;
					state?: "findable" | "registered" | "draft";
				};
			};
			responses: {
				/** @description A JSON array of clients stats. */
				200: {
					content: never;
				};
			};
		};
	};
	"/clients/{id}": {
		/** Return a client. */
		get: {
			parameters: {
				path: {
					/** @description Client ID */
					id: string;
				};
			};
			responses: {
				/** @description A JSON object. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Client"];
					};
				};
			};
		};
	};
	"/dois": {
		/** Return a list of dois. */
		get: {
			parameters: {
				query?: {
					query?: string;
					created?: number;
					registered?: number;
					published?: number;
					"provider-id"?: string;
					"client-id"?: string;
					"consortium-id"?: string;
					prefix?: string;
					certificate?:
						| "CLARIN"
						| "CoreTrustSeal"
						| "DIN 31644"
						| "DINI"
						| "DSA"
						| "RatSWD"
						| "WDS";
					"person-id"?: string;
					"affiliation-id"?: string;
					"resource-type-id"?:
						| "audiovisual"
						| "book"
						| "book-chapter"
						| "collection"
						| "computational-notebook"
						| "conference-paper"
						| "conference-proceeding"
						| "data-paper"
						| "dataset"
						| "dissertation"
						| "event"
						| "image"
						| "interactive-resource"
						| "journal"
						| "journal-article"
						| "model"
						| "output-management-plan"
						| "peer-review"
						| "physical-object"
						| "preprint"
						| "report"
						| "service"
						| "software"
						| "sound"
						| "standard"
						| "text"
						| "workflow"
						| "other";
					subject?: string;
					"field-of-science"?: string;
					license?: string;
					"schema-version"?: string;
					state?: "findable" | "registered" | "draft";
					/** @description Set affiliation=true to see additional affiliation information such as the affiliation identifier that was added in Schema 4.3. */
					affiliation?: boolean;
					"link-check-status"?: 200 | 400 | 401 | 403 | 404 | 410 | 429 | 500 | 502 | 503;
					/** @description Retreive a random sample of DOIs. When true, the page[number] parameter is ignored. */
					random?: boolean;
					"sample-size"?: number;
					"sample-group"?: "client" | "provider" | "resource-type";
					"page[number]"?: number;
					"page[size]"?: number;
					"page[cursor]"?: string;
					include?: "client" | "media";
					sort?:
						| "relevance"
						| "name"
						| "-name"
						| "created"
						| "-created"
						| "updated"
						| "-updated";
				};
			};
			responses: {
				/** @description A JSON array of dois. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Doi"];
					};
				};
			};
		};
		/** Add a new doi. */
		post: {
			requestBody: {
				content: {
					"application/vnd.api+json": components["schemas"]["Doi"];
				};
			};
			responses: {
				/** @description Created */
				201: {
					content: never;
				};
			};
		};
	};
	"/dois/{id}": {
		/** Return a doi. */
		get: {
			parameters: {
				path: {
					/** @description DOI */
					id: string;
				};
			};
			responses: {
				/** @description A JSON object. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Doi"];
					};
				};
			};
		};
		/** Update a doi. */
		put: {
			parameters: {
				path: {
					/** @description DOI */
					id: string;
				};
			};
			requestBody: {
				content: {
					"application/vnd.api+json": components["schemas"]["Doi"];
				};
			};
			responses: {
				/** @description OK */
				200: {
					content: never;
				};
			};
		};
		/** Delete a doi (for DOIs in draft state only). */
		delete: {
			parameters: {
				path: {
					/** @description DOI */
					id: string;
				};
			};
			responses: {
				/** @description No content */
				204: {
					content: never;
				};
			};
		};
	};
	"/dois/{id}/activities": {
		/** Return activity for a specific DOI. */
		get: {
			parameters: {
				path: {
					/** @description DOI */
					id: string;
				};
			};
			responses: {
				/** @description A JSON object. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Activity"];
					};
				};
			};
		};
	};
	"/events": {
		/** Return a list of events. */
		get: {
			parameters: {
				query?: {
					query?: string;
					"subj-id"?: string;
					"obj-id"?: string;
					doi?: string;
					orcid?: string;
					prefix?: string;
					subtype?: string;
					"citation-type"?: string;
					"source-id"?: string;
					"registrant-id"?: string;
					"relation-type-id"?: string;
					issn?: string;
					"publication-year"?: string;
					"year-month"?: string;
					"page[number]"?: number;
					"page[size]"?: number;
					"page[cursor]"?: string;
					include?: "subj" | "obj";
					sort?: "relevance" | "name" | "-name" | "created" | "-created";
				};
			};
			responses: {
				/** @description A JSON array of events. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Event"];
					};
				};
			};
		};
	};
	"/events/{id}": {
		/** Return an event. */
		get: {
			parameters: {
				path: {
					/** @description Event */
					id: string;
				};
			};
			responses: {
				/** @description A JSON array of events. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Event"];
					};
				};
			};
		};
	};
	"/heartbeat": {
		/** Return the current status of the REST API. */
		get: {
			responses: {
				/** @description REST API is operating normally. */
				200: {
					content: {
						"text/plain": string;
					};
				};
				/** @description REST API is not working properly. */
				500: {
					content: {
						"text/plain": string;
					};
				};
			};
		};
	};
	"/prefixes": {
		/** Return a list of prefixes. */
		get: {
			parameters: {
				query?: {
					year?: number;
					state?: "with-repository" | "without-repository" | "unassigned";
				};
			};
			responses: {
				/** @description A JSON array of prefixes. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Prefix"];
					};
				};
			};
		};
	};
	"/prefixes/totals": {
		/** Return prefixes DOI production statistics. */
		get: {
			parameters: {
				query?: {
					"client-id"?: string;
					/** @description Must be authenticated to view registered and draft DOIs. */
					state?: "findable" | "registered" | "draft";
				};
			};
			responses: {
				/** @description A JSON array of prefixes stats. */
				200: {
					content: never;
				};
			};
		};
	};
	"/prefixes/{id}": {
		/** Return a prefix. */
		get: {
			parameters: {
				path: {
					/** @description Prefix */
					id: string;
				};
			};
			responses: {
				/** @description Return a prefix. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Prefix"];
					};
				};
			};
		};
	};
	"/provider-prefixes": {
		/** Return a list of provider-prefixes. */
		get: {
			parameters: {
				query?: {
					query?: string;
					year?: number;
					"consortium-id"?: string;
					"provider-id"?: string;
					"prefix-id"?: string;
					"page[number]"?: number;
					sort?: "name" | "-name" | "created" | "-created";
				};
			};
			responses: {
				/** @description A JSON array of provider-prefixes. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["ProviderPrefix"];
					};
				};
			};
		};
	};
	"/providers": {
		/** Return a list of providers (including members and consortium organizations). */
		get: {
			parameters: {
				query?: {
					query?: string;
					/** @description The year the provider was created. */
					year?: number;
					"consortium-id"?: string;
					region?: "amer" | "apac" | "emea";
					"member-type"?:
						| "consortium_organization"
						| "direct_member"
						| "governmentAgency"
						| "consortium"
						| "member_only"
						| "developer";
					"organization-type"?:
						| "academicInstitution"
						| "governmentAgency"
						| "nationalInstitution"
						| "publisher"
						| "professionalSociety"
						| "researchInstitution"
						| "serviceProvider"
						| "internationalOrganization"
						| "other";
					"focus-area"?:
						| "naturalSciences"
						| "engineeringAndTechnology"
						| "medicalAndHealthSciences"
						| "agriculturalSciences"
						| "socialSciences"
						| "humanities"
						| "general";
					"has-required-contacts"?: boolean;
					"page[number]"?: number;
					"page[size]"?: number;
					sort?: "relevance" | "name" | "-name" | "created" | "-created";
				};
			};
			responses: {
				/** @description A JSON array of prefixes. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Provider"];
					};
				};
			};
		};
	};
	"/providers/totals": {
		/** Return providers DOI production statistics. */
		get: {
			parameters: {
				query?: {
					state?: "findable" | "registered" | "draft";
				};
			};
			responses: {
				/** @description A JSON array of providers stats. */
				200: {
					content: never;
				};
			};
		};
	};
	"/providers/{id}": {
		/** Return a provider. */
		get: {
			parameters: {
				path: {
					/** @description Provider ID */
					id: string;
				};
			};
			responses: {
				/** @description A JSON object. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Provider"];
					};
				};
			};
		};
	};
	"/reports": {
		/** A JSON array of reports. */
		get: {
			parameters: {
				query?: {
					/** @description Name of the Platform the usage is being requested for. This can be omitted if the service provides usage for only one platform. */
					platform?: string;
					/** @description The long name of the report. */
					"report-name"?: string;
					/** @description The report ID or code or shortname. Typically this will be the same code provided in the Report parameter of the request. */
					"report-id"?: string;
					/** @description The release or version of the report. */
					release?: string;
					/** @description Time the report was prepared. Format as defined by date-time - RFC3339 */
					created?: string;
					/** @description Name of the organization producing the report. */
					"created-by"?: string;
					"page[number]"?: number;
					"page[size]"?: number;
				};
			};
			responses: {
				/** @description A JSON array of reports. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Report"];
					};
				};
			};
		};
		/** Add a new report. */
		post: {
			requestBody: {
				content: {
					"application/vnd.api+json": components["schemas"]["Report"];
				};
			};
			responses: {
				/** @description Created */
				201: {
					content: never;
				};
			};
		};
	};
	"/reports/{id}": {
		/** Return a report. */
		get: {
			parameters: {
				path: {
					/** @description Report */
					id: string;
				};
			};
			responses: {
				/** @description A JSON object. */
				200: {
					content: {
						"application/vnd.api+json": components["schemas"]["Report"];
					};
				};
			};
		};
		/** Update a report. */
		put: {
			parameters: {
				path: {
					/** @description Report */
					id: string;
				};
			};
			requestBody: {
				content: {
					"application/vnd.api+json": components["schemas"]["Report"];
				};
			};
			responses: {
				/** @description OK */
				200: {
					content: never;
				};
			};
		};
		/** Delete a report. */
		delete: {
			parameters: {
				path: {
					/** @description Report */
					id: string;
				};
			};
			responses: {
				/** @description No content */
				204: {
					content: never;
				};
			};
		};
	};
}

export type webhooks = Record<string, never>;

export interface components {
	schemas: {
		/**
		 * @example {
		 *   "id": "tib.pangaea",
		 *   "attributes": {
		 *     "name": "Pangaea"
		 *   }
		 * }
		 */
		Client: {
			data?: {
				id?: string;
				type?: string;
				attributes?: {
					name?: string;
					symbol?: string;
					contactName?: string;
					contactEmail?: string;
					description?: string;
					domains?: string;
					url?: string;
					created?: string;
					updated?: string;
				};
			};
		};
		ClientPrefix: {
			data?: {
				id?: string;
				type?: string;
				attributes?: {
					created?: string;
					updated?: string;
				};
			};
		};
		/** @description Represents an activity for an event within DataCite systems. */
		Activity: {
			data?: {
				/** @example 0000-0000-0000-0000 */
				id?: string;
				type?: string;
				attributes?: {
					"prov:wasGeneratedBy"?: string;
					"prov:generatedAtTime"?: string;
					"prov:wasDerivedFrom"?: string;
					"prov:wasAttributedTo"?: string;
					action?: string;
					version?: number;
					changes?: Record<string, never>;
				};
			};
		};
		/**
		 * @description Represents a DOI and provides access to metadata attributes, further schema specific information can be found at https://schema.datacite.org
		 * @example {
		 *   "data": {
		 *     "type": "dois",
		 *     "attributes": {
		 *       "doi": "10.5438/0014",
		 *       "prefix": "10.5438",
		 *       "suffix": "0014",
		 *       "identifiers": [
		 *         {
		 *           "identifier": "https://doi.org/10.5438/0014",
		 *           "identifierType": "DOI"
		 *         }
		 *       ],
		 *       "creators": [
		 *         {
		 *           "name": "DataCite Metadata Working Group"
		 *         }
		 *       ],
		 *       "titles": [
		 *         {
		 *           "title": "DataCite Metadata Schema Documentation for the Publication and Citation of Research Data v4.1"
		 *         }
		 *       ],
		 *       "publisher": "DataCite",
		 *       "publicationYear": 2017,
		 *       "types": {
		 *         "resourceTypeGeneral": "Text"
		 *       },
		 *       "url": "https://schema.datacite.org/meta/kernel-4.1/"
		 *     }
		 *   }
		 * }
		 */
		Doi: {
			data?: {
				id?: string;
				/** @enum {string} */
				type: "dois";
				attributes?: {
					doi?: string;
					prefix?: string;
					suffix?: string;
					/**
					 * @description Can be set to trigger a DOI state change.
					 * @enum {string}
					 */
					event?: "publish" | "register" | "hide";
					identifiers?: {
						identifier?: string;
						identifierType?: string;
					}[];
					creators?: {
						/** @enum {string} */
						nameType?: "Personal" | "Organizational";
						nameIdentifiers?: {
							nameIdentifier?: string;
							nameIdentifierScheme?: string;
							schemeUri?: string;
						}[];
						name: string;
						givenName?: string;
						familyName?: string;
						affiliation?: {
							affiliationIdentifier?: string;
							affiliationIdentifierScheme?: string;
							name?: string;
							schemeUri?: string;
						}[];
					}[];
					titles?: {
						title: string;
						/** @enum {string} */
						titleType?: "AlternativeTitle" | "Subtitle" | "TranslatedTitle" | "Other";
						lang?: string;
					}[];
					publisher: string;
					container?: {
						readonly type?: string;
						readonly identifier?: string;
						readonly identifierType?: string;
						readonly title?: string;
						readonly volume?: string;
						readonly issue?: string;
						readonly firstPage?: string;
						readonly lastPage?: string;
					};
					publicationYear: number;
					subjects?: {
						subject?: string;
						subjectScheme?: string;
						schemeUri?: string;
						valueUri?: string;
						lang?: string;
					}[];
					contributors?: {
						/** @enum {string} */
						nameType?: "Personal" | "Organizational";
						nameIdentifiers?: {
							nameIdentifier?: string;
							nameIdentifierScheme?: string;
							schemeUri?: string;
						}[];
						name?: string;
						givenName?: string;
						familyName?: string;
						affiliation?: {
							affiliationIdentifier?: string;
							affiliationIdentifierScheme?: string;
							name?: string;
							schemeUri?: string;
						}[];
						/** @enum {string} */
						contributorType?:
							| "ContactPerson"
							| "DataCollector"
							| "DataCurator"
							| "DataManager"
							| "Distributor"
							| "Editor"
							| "HostingInstitution"
							| "Producer"
							| "ProjectLeader"
							| "ProjectManager"
							| "ProjectMember"
							| "RegistrationAgency"
							| "RegistrationAuthority"
							| "RelatedPerson"
							| "Researcher"
							| "ResearchGroup"
							| "RightsHolder"
							| "Sponsor"
							| "Supervisor"
							| "WorkPackageLeader"
							| "Other";
					}[];
					dates?: {
						date?: string;
						/** @enum {string} */
						dateType?:
							| "Accepted"
							| "Available"
							| "Copyrighted"
							| "Collected"
							| "Created"
							| "Issued"
							| "Submitted"
							| "Updated"
							| "Valid"
							| "Withdrawn"
							| "Other";
					}[];
					language?: string;
					types?: {
						/** @enum {string} */
						resourceTypeGeneral:
							| "Audiovisual"
							| "Book"
							| "BookChapter"
							| "Collection"
							| "ComputationalNotebook"
							| "ConferencePaper"
							| "ConferenceProceeding"
							| "DataPaper"
							| "Dataset"
							| "Dissertation"
							| "Event"
							| "Image"
							| "InteractiveResource"
							| "JournalArticle"
							| "Model"
							| "OutputManagementPlan"
							| "PeerReview"
							| "PhysicalObject"
							| "Preprint"
							| "Report"
							| "Service"
							| "Software"
							| "Sound"
							| "Standard"
							| "Text"
							| "Workflow"
							| "Other";
						resourceType?: string;
						schemaOrg?: string;
						bibtex?: string;
						citeproc?: string;
						ris?: string;
					};
					relatedIdentifiers?: {
						relatedIdentifier?: string;
						/** @enum {string} */
						relatedIdentifierType?:
							| "ARK"
							| "arXiv"
							| "bibcode"
							| "DOI"
							| "EAN13"
							| "EISSN"
							| "Handle"
							| "IGSN"
							| "ISBN"
							| "ISSN"
							| "ISTC"
							| "LISSN"
							| "LSID"
							| "PMID"
							| "PURL"
							| "UPC"
							| "URL"
							| "URN"
							| "w3id";
						/** @enum {string} */
						relationType?:
							| "IsCitedBy"
							| "Cites"
							| "IsSupplementTo"
							| "IsSupplementedBy"
							| "IsContinuedBy"
							| "Continues"
							| "IsDescribedBy"
							| "Describes"
							| "HasMetadata"
							| "IsMetadataFor"
							| "HasVersion"
							| "IsVersionOf"
							| "IsNewVersionOf"
							| "IsPreviousVersionOf"
							| "IsPartOf"
							| "HasPart"
							| "IsPublishedIn"
							| "IsReferencedBy"
							| "References"
							| "IsDocumentedBy"
							| "Documents"
							| "IsCompiledBy"
							| "Compiles"
							| "IsVariantFormOf"
							| "IsOriginalFormOf"
							| "IsIdenticalTo"
							| "IsReviewedBy"
							| "Reviews"
							| "IsDerivedFrom"
							| "IsSourceOf"
							| "IsRequiredBy"
							| "Requires"
							| "IsObsoletedBy"
							| "Obsoletes";
						resourceTypeGeneral?: string;
					}[];
					sizes?: string[];
					formats?: string[];
					version?: string;
					rightsList?: {
						rights?: string;
						rightsUri?: string;
						lang?: string;
					}[];
					descriptions?: {
						description?: string;
						/** @enum {string} */
						descriptionType?:
							| "Abstract"
							| "Methods"
							| "SeriesInformation"
							| "TableOfContents"
							| "TechnicalInfo"
							| "Other";
						lang?: string;
					}[];
					geoLocations?: {
						geoLocationPoint?: Record<string, never>;
						geoLocationBox?: Record<string, never>;
						geoLocationPlace?: string;
					}[];
					fundingReferences?: {
						funderName?: string;
						funderIdentifier?: string;
						/** @enum {string} */
						funderIdentifierType?:
							| "Crossref Funder ID"
							| "GRID"
							| "ISNI"
							| "ROR"
							| "Other";
						awardNumber?: string;
						awardUri?: string;
						awardTitle?: string;
					}[];
					relatedItems?: {
						/** @enum {string} */
						relatedItemType:
							| "Audiovisual"
							| "Book"
							| "BookChapter"
							| "Collection"
							| "ComputationalNotebook"
							| "ConferencePaper"
							| "ConferenceProceeding"
							| "DataPaper"
							| "Dataset"
							| "Dissertation"
							| "Event"
							| "Image"
							| "InteractiveResource"
							| "JournalArticle"
							| "Model"
							| "OutputManagementPlan"
							| "PeerReview"
							| "PhysicalObject"
							| "Preprint"
							| "Report"
							| "Service"
							| "Software"
							| "Sound"
							| "Standard"
							| "Text"
							| "Workflow"
							| "Other";
						/** @enum {string} */
						relationType:
							| "IsCitedBy"
							| "Cites"
							| "IsSupplementTo"
							| "IsSupplementedBy"
							| "IsContinuedBy"
							| "Continues"
							| "IsDescribedBy"
							| "Describes"
							| "HasMetadata"
							| "IsMetadataFor"
							| "HasVersion"
							| "IsVersionOf"
							| "IsNewVersionOf"
							| "IsPreviousVersionOf"
							| "IsPartOf"
							| "HasPart"
							| "IsPublishedIn"
							| "IsReferencedBy"
							| "References"
							| "IsDocumentedBy"
							| "Documents"
							| "IsCompiledBy"
							| "Compiles"
							| "IsVariantFormOf"
							| "IsOriginalFormOf"
							| "IsIdenticalTo"
							| "IsReviewedBy"
							| "Reviews"
							| "IsDerivedFrom"
							| "IsSourceOf"
							| "IsRequiredBy"
							| "Requires"
							| "IsObsoletedBy"
							| "Obsoletes";
						relatedItemIdentifier?: {
							relatedItemIdentifier?: string;
							/** @enum {string} */
							relatedItemIdentifierType?:
								| "ARK"
								| "arXiv"
								| "bibcode"
								| "DOI"
								| "EAN13"
								| "EISSN"
								| "Handle"
								| "IGSN"
								| "ISBN"
								| "ISSN"
								| "ISTC"
								| "LISSN"
								| "LSID"
								| "PMID"
								| "PURL"
								| "UPC"
								| "URL"
								| "URN"
								| "w3id";
							relatedMetadataScheme?: string;
							schemeURI?: string;
							schemeType?: string;
						};
						creators?: {
							name: string;
							givenName?: string;
							familyName?: string;
							/** @enum {string} */
							nameType?: "Personal" | "Organizational";
						}[];
						titles?: {
							title: string;
							/** @enum {string} */
							titleType?:
								| "AlternativeTitle"
								| "Subtitle"
								| "TranslatedTitle"
								| "Other";
						}[];
						volume?: string;
						issue?: string;
						number?: string;
						/** @enum {string} */
						numberType?: "Article" | "Chapter" | "Report" | "Other";
						firstPage?: string;
						lastPage?: string;
						publisher?: string;
						publicationYear?: string;
						edition?: string;
						contributors?: {
							name: string;
							givenName?: string;
							familyName?: string;
							/** @enum {string} */
							nameType?: "Personal" | "Organizational";
							/** @enum {string} */
							contributorType:
								| "ContactPerson"
								| "DataCollector"
								| "DataCurator"
								| "DataManager"
								| "Distributor"
								| "Editor"
								| "HostingInstitution"
								| "Producer"
								| "ProjectLeader"
								| "ProjectManager"
								| "ProjectMember"
								| "RegistrationAgency"
								| "RegistrationAuthority"
								| "RelatedPerson"
								| "Researcher"
								| "ResearchGroup"
								| "RightsHolder"
								| "Sponsor"
								| "Supervisor"
								| "WorkPackageLeader"
								| "Other";
						}[];
					}[];
					url?: string;
					contentUrl?: string[];
					metadataVersion?: number;
					schemaVersion?: string;
					source?: string;
					isActive?: boolean;
					state?: string;
					reason?: string;
					/** @description Data describing the landing page, used by link checking. */
					landingPage?: {
						checked?: string;
						url?: string;
						contentType?: string;
						error?: string;
						redirectCount?: number;
						redirectUrls?: string[];
						downloadLatency?: number;
						hasSchemaOrg?: boolean;
						schemaOrgid?: string;
						dcIdentifier?: string;
						citationDoi?: string;
						bodyhasPid?: boolean;
					};
					created?: string;
					registered?: string;
					updated?: string;
				};
			};
		};
		Event: {
			data?: {
				id?: string;
				type?: string;
				attributes?: {
					subjId?: string;
					objId?: string;
					/** @enum {string} */
					messageAction?: "create" | "delete";
					relationTypeId?: string;
					sourceToken?: string;
					sourceId?: string;
					total?: number;
					license?: string;
					occuredAt?: string;
					timestamp?: string;
					subj?: Record<string, never>;
					obj?: Record<string, never>;
				};
			};
		};
		Prefix: {
			data?: {
				prefix?: string;
			};
		};
		ProviderPrefix: {
			data?: {
				id?: string;
				attributes?: {
					created?: string;
					updated?: string;
				};
			};
		};
		/**
		 * @example {
		 *   "id": "bl",
		 *   "attributes": {
		 *     "name": "British Library",
		 *     "symbol": "BL"
		 *   }
		 * }
		 */
		Provider: {
			data?: {
				id?: string;
				name?: string;
				symbol?: string;
			};
		};
		/** @description Describes the formatting needs for the COUNTER Dataset Report. Response may include the Report_Header (optional), Report_Datasets (usage stats). */
		Report: {
			data?: {
				/** @example 0000-0000-0000-0000 */
				id?: string;
				/**
				 * @description The long name of the report.
				 * @example Dataset Report
				 */
				"report-name"?: string;
				/**
				 * @description The report ID or code or shortname. Typically this will be the same code provided in the Report parameter of the request.
				 * @example DSR
				 */
				"report-id"?: string;
				/**
				 * @description The release or version of the report.
				 * @example RD1
				 */
				release?: string;
				/**
				 * Format: dateTime
				 * @description Time the report was prepared. Format as defined by date-time - RFC3339
				 * @example 2016-09-08T22:47:31Z
				 */
				created?: string;
				/**
				 * @description Name of the organization producing the report.
				 * @example DataONE
				 */
				"created-by"?: string;
				/** @description Zero or more report filters used for this report. Typically reflect filters provided on the Request. Filters limit the data to be reported on. */
				"report-filters"?: string;
				/** @description Zero or more additional attributes applied to the report. Attributes inform the level of detail in the report. */
				"report-attributes"?: string;
				/** @description Time the report was prepared. */
				"reporting-period"?: string;
				/** @description Defines the output for the Report_Datasets being returned in a Dataset Report. Collection of datasets from the report. */
				"report-datasets"?: string;
			};
		};
	};
	responses: never;
	parameters: never;
	requestBodies: never;
	headers: never;
	pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export type operations = Record<string, never>;
