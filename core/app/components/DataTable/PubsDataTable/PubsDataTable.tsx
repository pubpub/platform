import type { CommunitiesId, UsersId } from "db/public";

import { getPubsCount, getPubsWithRelatedValues } from "~/lib/server";
import { PubsDataTableClient } from "./table";
import { searchParamsCache } from "./validations";

type Props = {
	communityId: CommunitiesId;
	userId: UsersId;
	searchParams: { [key: string]: string | string[] | undefined };
};

export const PubsDataTable = async ({ communityId, userId, searchParams }: Props) => {
	const search = searchParamsCache.parse(searchParams);
	const promises = Promise.all([
		getPubsCount({ communityId }),
		getPubsWithRelatedValues(
			{ communityId, userId },
			{
				limit: search.perPage,
				offset: (search.page - 1) * search.perPage,
				orderBy: "updatedAt",
				orderDirection: search.sort[0].desc ? "desc" : "asc",
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
				withLegacyAssignee: true,
			}
		),
	]);
	return <PubsDataTableClient promises={promises} />;
};
