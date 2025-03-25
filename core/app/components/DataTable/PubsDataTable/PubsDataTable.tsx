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
	// We are only able to sort by one thing right now, so grab the first thing
	const sort = search.sort[0];
	const promises = Promise.all([
		getPubsCount({ communityId }),
		getPubsWithRelatedValues(
			{ communityId, userId },
			{
				limit: search.perPage,
				offset: (search.page - 1) * search.perPage,
				// The search param parser lets us sort by any key of a pub, but we only support updatedAt and createdAt atm
				orderBy: sort.id === "createdAt" ? "createdAt" : "updatedAt",
				orderDirection: search.sort[0].desc ? "desc" : "asc",
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
				withLegacyAssignee: true,
			}
		),
	]);
	return <PubsDataTableClient promises={promises} perPage={search.perPage} />;
};
