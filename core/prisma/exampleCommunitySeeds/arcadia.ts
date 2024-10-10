import { CoreSchemaType } from "db/public";

import { seedCommunity } from "../seed/seedCommunity";

export const arcadiaSeed = seedCommunity({
	community: {
		slug: "arcadia-research",
		name: "Arcadia Research",
		avatar: "https://avatars.githubusercontent.com/u/100431031?s=200&v=4",
	},
	pubFields: {
		Title: CoreSchemaType.HTML,
		"Publication Date": CoreSchemaType.DateTime,
		"Creation Date": CoreSchemaType.DateTime,
		"Last Edited": CoreSchemaType.DateTime,
		Avatar: CoreSchemaType.FileUpload,
		Description: CoreSchemaType.HTML,
		Abstract: CoreSchemaType.HTML,
		License: CoreSchemaType.String,
		PubContent: CoreSchemaType.ContextString,
		DOI: CoreSchemaType.URL,
	},
	pubTypes: {
		"Journal Article": {
			Title: true,
			Abstract: true,
			"Publication Date": true,
			"Last Edited": true,
			"Publication Type": true,
			DOI: true,
			PubContent: true,
			License: true,
			Description: true,
			"Creation Date": true,
			Avatar: true,
		},
	},
	pubs: [],
	stages: {},
	forms: {},
	stageConnections: {},
	users: {},
});
