"use server"

import type { action } from "./action"

import { logger } from "logger"

import { defineRun } from "../types"

<<<<<<< HEAD
export const run = defineRun<typeof action>(async ({ pub, config }) => {
	const text = config.text;
	const debounce = config.debounce;
=======
export const run = defineRun<typeof action>(async ({ actionInstance, pub, config }) => {
	const text = config.text
	const debounce = config.debounce
>>>>>>> main

	logger.info({
		msg: `Logging${text ? ` ${text}` : ""}`,
		pub,
		debounce,
		config,
	})

	return {
		success: true,
		report: `Logged out ${text || "some data"}, check your console.`,
		title: `Successfully ran log action`,
		data: {},
	}
})
