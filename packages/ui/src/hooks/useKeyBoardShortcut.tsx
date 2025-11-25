"use client"

import type { PropsWithChildren } from "react"
import type { Platform } from "./usePlatform"

import * as React from "react"
import { useEffect } from "react"

import { usePlatform } from "./usePlatform"

/**
 * The priority of the keyboard shortcut.
 *
 * If you find yourself using HIGH, question whether you really need to
 */
export enum KeyboardShortcutPriority {
	LOW = 0,
	MEDIUM = 1,
	HIGH = 2,
}

interface KeyboardShortcut {
	key: string
	modifiers: {
		ctrl?: true
		meta?: true
		shift?: true
		alt?: true
		mod?: true
	}
	/**
	 * If true, the shortcut will continue to be triggered even if the key is held down.
	 * @default false
	 */
	allowRepeat?: boolean
	handler: (event: KeyboardEvent) => void
	priority: KeyboardShortcutPriority // higher number = higher priority
}

interface KeyboardShortcutContextType {
	register: (shortcut: KeyboardShortcut) => () => void
}

const KeyboardShortcutContext = React.createContext<KeyboardShortcutContextType | null>(null)

const isMatchingEvent = (event: KeyboardEvent, shortcut: KeyboardShortcut, platform: Platform) => {
	if (!shortcut.allowRepeat && event.repeat) {
		return false
	}

	const { modifiers } = shortcut

	let ctrlMatch = true
	let metaMatch = true

	if (modifiers.mod !== undefined) {
		if (platform === "mac") {
			// on mac, mod = meta (cmd)
			metaMatch = modifiers.mod === event.metaKey
		} else {
			// on other platforms, mod = ctrl
			ctrlMatch = modifiers.mod === event.ctrlKey
		}
	}

	// check explicit modifier matches (these override mod if specified)
	if (modifiers.ctrl !== undefined) {
		ctrlMatch = modifiers.ctrl === event.ctrlKey
	}
	if (modifiers.meta !== undefined) {
		metaMatch = modifiers.meta === event.metaKey
	}

	const shiftMatch = modifiers.shift === undefined || modifiers.shift === event.shiftKey
	const altMatch = modifiers.alt === undefined || modifiers.alt === event.altKey

	return ctrlMatch && metaMatch && shiftMatch && altMatch
}

export function KeyboardShortcutProvider({ children }: PropsWithChildren) {
	const shortcutsRef = React.useRef<Map<string, KeyboardShortcut[]>>(new Map())
	const platform = usePlatform()

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const key = event.key.toLowerCase()
			const shortcuts = shortcutsRef.current.get(key) || []
			event.code

			const sortedShortcuts = [...shortcuts].sort((a, b) => b.priority - a.priority)

			for (const shortcut of sortedShortcuts) {
				const matching = isMatchingEvent(event, shortcut, platform)

				if (matching) {
					event.preventDefault()
					shortcut.handler(event)
					return
				}
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [platform])

	const register = (shortcut: KeyboardShortcut) => {
		const key = shortcut.key.toLowerCase()
		const shortcuts = shortcutsRef.current.get(key) || []
		shortcuts.push(shortcut)
		shortcutsRef.current.set(key, shortcuts)

		return () => {
			const currentShortcuts = shortcutsRef.current.get(key) || []
			const filtered = currentShortcuts.filter((s) => s !== shortcut)
			if (filtered.length === 0) {
				shortcutsRef.current.delete(key)
			} else {
				shortcutsRef.current.set(key, filtered)
			}
		}
	}

	return (
		<KeyboardShortcutContext.Provider value={{ register }}>
			{children}
		</KeyboardShortcutContext.Provider>
	)
}

type Modifiers = "Mod" | "Ctrl" | "Shift" | "Alt" | "Meta"

// prettier-ignore
type Keys =
	| "a"
	| "b"
	| "c"
	| "d"
	| "e"
	| "f"
	| "g"
	| "h"
	| "i"
	| "j"
	| "k"
	| "l"
	| "m"
	| "n"
	| "o"
	| "p"
	| "q"
	| "r"
	| "s"
	| "t"
	| "u"
	| "v"
	| "w"
	| "x"
	| "y"
	| "z"
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	| "0"
	| "F1"
	| "F2"
	| "F3"
	| "F4"
	| "F5"
	| "F6"
	| "F7"
	| "F8"
	| "F9"
	| "F10"
	| "F11"
	| "F12"
	| "ArrowUp"
	| "ArrowDown"
	| "ArrowLeft"
	| "ArrowRight"
	| "Enter"
	| "Escape"
	| "Backspace"
	| "Tab"
	| "Space"
	| "Delete"
	| "Home"
	| "End"
	| "PageUp"
	| "PageDown"
	| "CapsLock"
	| "NumLock"
	| "ScrollLock"
	| "Pause"
	| "PrintScreen"
	| "Insert"

export type KeyCombination =
	| `${Modifiers}+${Keys}`
	| `${Modifiers}+${Modifiers}+${Keys}`
	| `${Modifiers}+${Modifiers}+${Modifiers}+${Keys}`
	| `${Modifiers}+${Modifiers}+${Modifiers}+${Modifiers}+${Keys}`

export function parseKeyboardShortcut(
	shortcut: string
): Pick<KeyboardShortcut, "key" | "modifiers"> {
	const [modifiers, key] = shortcut.split("+")

	return {
		modifiers: {
			ctrl: modifiers.includes("Ctrl") || undefined,
			meta: modifiers.includes("Meta") || undefined,
			shift: modifiers.includes("Shift") || undefined,
			alt: modifiers.includes("Alt") || undefined,
			mod: modifiers.includes("Mod") || undefined,
		},
		key: key.toLowerCase(),
	}
}

const defaultOptions: Pick<KeyboardShortcut, "priority" | "allowRepeat"> = {
	priority: KeyboardShortcutPriority.LOW,
	allowRepeat: false,
}

export function useKeyboardShortcut(
	shortcut: KeyCombination,
	handler: KeyboardShortcut["handler"],
	options?: {
		priority?: KeyboardShortcutPriority
		allowRepeat?: boolean
	}
) {
	const parsedShortcut = parseKeyboardShortcut(shortcut)

	const opts = {
		...parsedShortcut,
		...defaultOptions,
		...options,
		handler,
	}

	const context = React.useContext(KeyboardShortcutContext)

	if (!context) {
		throw new Error("useKeyboardShortcut must be used within KeyboardShortcutProvider")
	}

	useEffect(() => {
		return context.register(opts)
	}, [context.register, opts])

	return
}
