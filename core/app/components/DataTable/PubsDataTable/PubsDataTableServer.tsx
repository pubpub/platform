import type { CommunitiesId, UsersId } from "db/public";

import { getPubsCount, getPubsWithRelatedValues } from "~/lib/server";
import { PubsDataTable } from "./PubsDataTableClient";
import { getFilterParamsFromSearch, searchParamsCache } from "./validations";

type Props = {
	communityId: CommunitiesId;
	userId: UsersId;
	searchParams: { [key: string]: string | string[] | undefined };
};

export const PubsDataTableServer = async ({ communityId, userId, searchParams }: Props) => {
	const search = searchParamsCache.parse(searchParams);
	const { limit, offset, orderBy, orderDirection } = getFilterParamsFromSearch(search);
	const promises = Promise.all([
		getPubsCount({ communityId }),
		getPubsWithRelatedValues(
			{ communityId, userId },
			{
				limit,
				offset,
				orderBy,
				orderDirection,
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
				withLegacyAssignee: true,
			}
		),
	]);
	return <PubsDataTable promises={promises} perPage={search.perPage} />;
};
