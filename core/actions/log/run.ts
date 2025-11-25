"use server"

import type { action } from "./action"

import { logger } from "logger"

import { defineRun } from "../types"

export const run = defineRun<typeof action>(async ({ actionInstance, pub, config }) => {
	const text = config.text
	const debounce = config.debounce

	logger.info({
		msg: `Logging${text ? ` ${text}` : ""}`,
		pub,
		debounce,
		config,
	})

	return {
		success: true,
		report: `Logged out ${text || "some data"}, check your console.`,
		title: `Successfully ran ${actionInstance.name}`,
		data: {},
	}
})
