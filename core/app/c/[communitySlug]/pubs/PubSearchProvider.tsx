"use client";

import type { Dispatch, SetStateAction } from "react";

import {
	createContext,
	useCallback,
	useContext,
	useDeferredValue,
	useEffect,
	useState,
} from "react";
import { useQueryStates } from "nuqs";
import { useDebouncedCallback } from "use-debounce";

import type { PubTypes, Stages } from "db/public";

import type { PubSearchParams } from "./pubQuery";
import { pubSearchParsers } from "./pubQuery";

type Props = {
	children: React.ReactNode;
} & {
	availablePubTypes: PubTypes[];
	availableStages: Stages[];
};
type FullPubSearchParams = Omit<PubSearchParams, "pubTypes" | "stages"> & {
	pubTypes: PubTypes[];
	stages: Stages[];
};

type PubSearchContextType = {
	queryParams: FullPubSearchParams;
	availablePubTypes: PubTypes[];
	availableStages: Stages[];
	inputValues: PubSearchParams;
	setQuery: Dispatch<SetStateAction<string>>;
	setFilters: Dispatch<SetStateAction<PubSearchParams>>;
	stale: boolean;
};

const DEFAULT_SEARCH_PARAMS = {
	pubTypes: [],
	stages: [],
	filters: [],
	query: "",
	page: 1,
	sort: [{ id: "updatedAt", desc: true }],
	perPage: 10,
};

const PubSearchContext = createContext<PubSearchContextType>({
	queryParams: DEFAULT_SEARCH_PARAMS as FullPubSearchParams,
	inputValues: DEFAULT_SEARCH_PARAMS as PubSearchParams,
	availablePubTypes: [],
	availableStages: [],
	stale: false,
	setQuery: () => "",
	setFilters: () => DEFAULT_SEARCH_PARAMS,
});

const DEBOUNCE_TIME = 300;

const isStale = (query: PubSearchParams, inputValues: PubSearchParams) => {
	if (query.query !== inputValues.query) {
		return true;
	}

	const sort = query.sort[0];
	if (sort.id !== inputValues.sort[0]?.id || sort.desc !== inputValues.sort[0]?.desc) {
		return true;
	}

	if (query.page !== inputValues.page) {
		return true;
	}

	if (query.perPage !== inputValues.perPage) {
		return true;
	}

	if (query.pubTypes) {
		const currentPubTypesSet = new Set(query.pubTypes);
		const inputPubTypesSet = new Set(inputValues.pubTypes);

		if (
			currentPubTypesSet.difference(inputPubTypesSet).size !== 0 ||
			inputPubTypesSet.difference(currentPubTypesSet).size !== 0
		) {
			return true;
		}
	}

	if (query.stages) {
		const currentStagesSet = new Set(query.stages);
		const inputStagesSet = new Set(inputValues.stages);

		if (
			currentStagesSet.difference(inputStagesSet).size !== 0 ||
			inputStagesSet.difference(currentStagesSet).size !== 0
		) {
			return true;
		}
	}

	if (query.filters) {
		for (const [idx, filter] of Object.entries(query.filters)) {
			const inputFilter = inputValues.filters[Number(idx)];

			if (
				inputFilter.id !== filter.id ||
				inputFilter.operator !== filter.operator ||
				inputFilter.value !== filter.value
			) {
				return true;
			}
		}
	}

	return false;
};

export function PubSearchProvider({ children, ...props }: Props) {
	const [queryparams, setQueryParaams] = useQueryStates(pubSearchParsers, {
		shallow: false,
	});

	// local input state for immediate UI responsiveness + sync with URL
	// otherwise, when navigating back/forward or refreshing, the input will be empty
	const [inputValues, setInputValues] = useState(queryparams);

	// deferred query to keep track of server updates
	// without this, we cant only compare eg inputValues.query with query.query,
	// which only tells us that the debounce has happened
	const deferredQuery = useDeferredValue(queryparams);

	const currentPubTypes = props.availablePubTypes?.filter((type) =>
		queryparams.pubTypes?.includes(type.id)
	);
	const currentStages = props.availableStages?.filter((stage) =>
		queryparams.stages?.includes(stage.id)
	);

	const stale = isStale(deferredQuery, inputValues);

	// sync input with URL when navigating back/forward
	useEffect(() => {
		// if (isStale(query, inputValues)) {
		// 	return;
		// }
		setInputValues(queryparams);
	}, []);

	const debouncedSetQuery = useDebouncedCallback((value: SetStateAction<string>) => {
		setQueryParaams((old) => {
			const newQuery = typeof value === "function" ? value(old.query) : value;
			return { ...old, query: newQuery, page: 1 };
		}); // reset to page 1 on new search
	}, DEBOUNCE_TIME);

	const setQuery = useCallback(
		(value: SetStateAction<string>) => {
			setInputValues((old) => {
				const newQuery = typeof value === "function" ? value(old.query) : value;
				return { ...old, query: newQuery, page: 1 };
			});
			if (value.length >= 2 || value.length === 0) {
				debouncedSetQuery(value);
			}
		},
		[debouncedSetQuery]
	);

	const setFilters = useCallback((filters: SetStateAction<PubSearchParams>) => {
		setInputValues((old) => {
			const newFilters = typeof filters === "function" ? filters(old) : filters;
			return {
				...old,
				...newFilters,
			};
		});
		setQueryParaams((old) => {
			const newFilters = typeof filters === "function" ? filters(old) : filters;
			return {
				...old,
				...newFilters,
			};
		});
	}, []);

	return (
		<PubSearchContext.Provider
			value={{
				queryParams: {
					pubTypes: currentPubTypes,
					stages: currentStages,
					filters: queryparams.filters,
					query: queryparams.query,
					page: queryparams.page,
					sort: queryparams.sort,
					perPage: queryparams.perPage,
				},
				availablePubTypes: props.availablePubTypes,
				availableStages: props.availableStages,
				setQuery,
				inputValues,
				stale,
				setFilters,
			}}
		>
			{children}
		</PubSearchContext.Provider>
	);
}

export const usePubSearch = () => {
	const pubSearch = useContext(PubSearchContext);
	return pubSearch;
};
