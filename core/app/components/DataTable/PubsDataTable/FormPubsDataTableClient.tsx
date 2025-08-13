"use client";

import { useState } from "react";

import type { NonGenericProcessedPub } from "contracts";
import type { PubsId, PubTypes } from "db/public";

import { client } from "~/lib/api";
import { type GetManyParams } from "~/lib/server";
import { useCommunity } from "../../providers/CommunityProvider";
import { PubsDataTableClientBase } from "./PubsDataTableClient";

type FormPubsDataTableClientProps = {
	/* The slug of the field on the form that's being used to render the table */
	formSlug: string;
	fieldSlug: string;
	selectedPubs?: NonGenericProcessedPub[];
	onSelectedPubsChange?: (pubs: NonGenericProcessedPub[]) => void;
	disabledRows?: PubsId[];
	pubTypes?: Pick<PubTypes, "id" | "name">[];
	currentPubId?: PubsId;
};

/**
 * Form-context aware version of PubsDataTableClient that uses the secure form endpoint.
 * This component can only be used within a form context and requires a valid form token.
 */
export const FormPubsDataTableClient = (props: FormPubsDataTableClientProps) => {
	const [filterParams, setFilterParams] = useState<Required<GetManyParams>>({
		limit: 10,
		offset: 0,
		orderBy: "updatedAt",
		orderDirection: "desc",
	});

	const community = useCommunity();

	const { data, isLoading } = client.forms.getPubsForFormField.useQuery({
		queryKey: ["getPubsForFormField", props.formSlug, props.fieldSlug, filterParams],
		queryData: {
			query: {
				...filterParams,
				pubTypeId: props.pubTypes ? props.pubTypes.map((p) => p.id) : undefined,
				withPubType: true,
				withRelatedPubs: false,
				withStage: true,
				withValues: false,
				currentPubId: props.currentPubId,
			},
			params: {
				communitySlug: community.slug,
				formSlug: props.formSlug,
				fieldSlug: props.fieldSlug,
			},
		},
	});

	return (
		<PubsDataTableClientBase
			{...props}
			data={data}
			isLoading={isLoading}
			filterParams={filterParams}
			setFilterParams={setFilterParams}
		/>
	);
};
