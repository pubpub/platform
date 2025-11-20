import { AsyncLocalStorage } from "node:async_hooks"

import { logger } from "logger"

// tags
export const transactionStorage = new AsyncLocalStorage<{
	isTransaction: boolean
	keys: Set<string>
	savedTags: Set<string>
	revalidateTags: Set<string>
}>()

export const getTransactionStore = () => {
	return transactionStorage.getStore()
}

export const setTransactionStore = ({
	isTransaction,
	savedTags,
	revalidateTags,
	key,
}: {
	isTransaction?: boolean
	savedTags?: string[]
	revalidateTags?: string[]
	key?: string
}) => {
	const store = transactionStorage.getStore()

	if (!store) {
		logger.debug("no transaction tags store found")
		return
	}

	if (isTransaction) {
		store.isTransaction = true
	}

	if (!isTransaction && !store.isTransaction) {
		// don't set anything on the store
		return
	}

	if (savedTags?.length) {
		for (const tag of savedTags) {
			store.savedTags.add(tag)
		}
	}

	if (revalidateTags?.length) {
		for (const tag of revalidateTags) {
			store.revalidateTags.add(tag)
		}
	}

	if (key) {
		store.keys.add(key)
	}
}
