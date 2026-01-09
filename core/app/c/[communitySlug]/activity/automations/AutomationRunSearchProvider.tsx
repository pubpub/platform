"use client"

import type { Automations, Stages } from "db/public"
import type { Dispatch, SetStateAction } from "react"
import type { AutomationRunComputedStatus } from "~/actions/results"
import type { AutomationRunSearchParams } from "./automationRunQuery"

import {
	createContext,
	useCallback,
	useContext,
	useDeferredValue,
	useEffect,
	useMemo,
	useState,
} from "react"
import { useQueryStates } from "nuqs"
import { useDebouncedCallback } from "use-debounce"

import { automationRunSearchParsers } from "./automationRunQuery"

export type AvailableAutomation = Pick<Automations, "id" | "name" | "icon">

type Props = {
	children: React.ReactNode
	availableAutomations: AvailableAutomation[]
	availableStages: Stages[]
	availableActions: { id: string; name: string }[]
}

type FullAutomationRunSearchParams = Omit<
	AutomationRunSearchParams,
	"automations" | "statuses" | "stages" | "actions"
> & {
	automations: AvailableAutomation[]
	statuses: AutomationRunComputedStatus[]
	stages: Stages[]
	actions: { id: string; name: string }[]
}

type AutomationRunSearchContextType = {
	queryParams: FullAutomationRunSearchParams
	availableAutomations: AvailableAutomation[]
	availableStages: Stages[]
	availableActions: { id: string; name: string }[]
	inputValues: AutomationRunSearchParams
	setQuery: Dispatch<SetStateAction<string>>
	setFilters: Dispatch<SetStateAction<AutomationRunSearchParams>>
	stale: boolean
	setInputValues: Dispatch<SetStateAction<AutomationRunSearchParams>>
}

const DEFAULT_SEARCH_PARAMS = {
	automations: [],
	statuses: [],
	stages: [],
	actions: [],
	filters: [],
	query: "",
	page: 1,
	sort: [{ id: "createdAt", desc: true }],
	perPage: 25,
}

const AutomationRunSearchContext = createContext<AutomationRunSearchContextType>({
	queryParams: DEFAULT_SEARCH_PARAMS as FullAutomationRunSearchParams,
	inputValues: DEFAULT_SEARCH_PARAMS as AutomationRunSearchParams,
	availableAutomations: [],
	availableStages: [],
	availableActions: [],
	stale: false,
	setQuery: () => "",
	setFilters: () => DEFAULT_SEARCH_PARAMS,
	setInputValues: () => {},
})

const DEBOUNCE_TIME = 300

const isStale = (query: AutomationRunSearchParams, inputValues: AutomationRunSearchParams) => {
	if (inputValues.query.length === 1) {
		return false
	}

	if (query.query !== inputValues.query) {
		return true
	}

	const sort = query.sort[0]
	if (sort.id !== inputValues.sort[0]?.id || sort.desc !== inputValues.sort[0]?.desc) {
		return true
	}

	if (query.page !== inputValues.page) {
		return true
	}

	if (query.perPage !== inputValues.perPage) {
		return true
	}

	if (query.automations) {
		const currentAutomationsSet = new Set(query.automations)
		const inputAutomationsSet = new Set(inputValues.automations)

		if (
			currentAutomationsSet.difference(inputAutomationsSet).size !== 0 ||
			inputAutomationsSet.difference(currentAutomationsSet).size !== 0
		) {
			return true
		}
	}

	if (query.statuses) {
		const currentStatusesSet = new Set(query.statuses)
		const inputStatusesSet = new Set(inputValues.statuses)

		if (
			currentStatusesSet.difference(inputStatusesSet).size !== 0 ||
			inputStatusesSet.difference(currentStatusesSet).size !== 0
		) {
			return true
		}
	}

	if (query.stages) {
		const currentStagesSet = new Set(query.stages)
		const inputStagesSet = new Set(inputValues.stages)

		if (
			currentStagesSet.difference(inputStagesSet).size !== 0 ||
			inputStagesSet.difference(currentStagesSet).size !== 0
		) {
			return true
		}
	}

	if (query.actions) {
		const currentActionsSet = new Set(query.actions)
		const inputActionsSet = new Set(inputValues.actions)

		if (
			currentActionsSet.difference(inputActionsSet).size !== 0 ||
			inputActionsSet.difference(currentActionsSet).size !== 0
		) {
			return true
		}
	}

	return false
}

export function AutomationRunSearchProvider({ children, ...props }: Props) {
	const [queryparams, setQueryParaams] = useQueryStates(automationRunSearchParsers, {
		shallow: false,
	})

	const [inputValues, setInputValues] = useState(queryparams)

	const deferredQuery = useDeferredValue(queryparams)

	const currentAutomations = props.availableAutomations?.filter((automation) =>
		queryparams.automations?.includes(automation.id)
	)

	const currentStatuses = queryparams.statuses as AutomationRunComputedStatus[]

	const currentStages = props.availableStages?.filter((stage) =>
		queryparams.stages?.includes(stage.id)
	)

	const currentActions = props.availableActions?.filter((action) =>
		queryparams.actions?.includes(action.id)
	)

	const stale = useMemo(() => isStale(deferredQuery, inputValues), [deferredQuery, inputValues])

	useEffect(() => {
		setInputValues(queryparams)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const debouncedSetQuery = useDebouncedCallback((value: SetStateAction<string>) => {
		setQueryParaams((old) => {
			const newQuery = typeof value === "function" ? value(old.query) : value
			return { ...old, query: newQuery, page: 1 }
		})
	}, DEBOUNCE_TIME)

	const setQuery = useCallback(
		(value: SetStateAction<string>) => {
			setInputValues((old) => {
				const newQuery = typeof value === "function" ? value(old.query) : value
				return { ...old, query: newQuery, page: 1 }
			})
			if (value.length >= 2 || value.length === 0) {
				debouncedSetQuery(value)
			}
		},
		[debouncedSetQuery]
	)

	const setFilters = useCallback(
		(filters: SetStateAction<AutomationRunSearchParams>) => {
			setInputValues((old) => {
				const newFilters = typeof filters === "function" ? filters(old) : filters
				return {
					...old,
					...newFilters,
				}
			})
			setQueryParaams((old) => {
				const newFilters = typeof filters === "function" ? filters(old) : filters
				return {
					...old,
					...newFilters,
				}
			})
		},
		[setQueryParaams]
	)

	return (
		<AutomationRunSearchContext.Provider
			value={{
				queryParams: {
					automations: currentAutomations,
					statuses: currentStatuses,
					stages: currentStages,
					actions: currentActions,
					filters: queryparams.filters,
					query: queryparams.query,
					page: queryparams.page,
					sort: queryparams.sort,
					perPage: queryparams.perPage,
				},
				availableAutomations: props.availableAutomations,
				availableStages: props.availableStages,
				availableActions: props.availableActions,
				setQuery,
				inputValues,
				setInputValues,
				stale,
				setFilters,
			}}
		>
			{children}
		</AutomationRunSearchContext.Provider>
	)
}

export const useAutomationRunSearch = () => {
	const automationRunSearch = useContext(AutomationRunSearchContext)
	return automationRunSearch
}
