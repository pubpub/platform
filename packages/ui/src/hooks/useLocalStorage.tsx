"use client";

import * as React from "react";

export type LocalStorageContext = {
	prefix?: string;
	timeout?: number;
};
export const LocalStorageContext = React.createContext<Record<string, any>>({
	prefix: "",
	timeout: 0,
});
export const LocalStorageProvider = (props: React.PropsWithChildren<LocalStorageContext>) => {
	return (
		<LocalStorageContext.Provider value={props}>{props.children}</LocalStorageContext.Provider>
	);
};

export const useLocalStorage = <T,>(key: string): [T | undefined, (value: T) => void] => {
	const { prefix = "", timeout } = React.useContext(LocalStorageContext);
	key = React.useMemo(() => prefix + key, []);
	const timestamp = React.useRef(performance.now());
	const value = React.useMemo<T | undefined>(() => {
		if (typeof localStorage === "undefined") {
			return undefined;
		}
		const item = localStorage.getItem(key);
		if (item) {
			return JSON.parse(item);
		}
		return undefined;
	}, []);
	const tail = React.useRef<T>();
	const tailTimer = React.useRef<ReturnType<typeof setTimeout>>();
	const setValue = React.useCallback(
		(value: T) => {
			const now = performance.now();
			if (tailTimer.current) {
				clearTimeout(tailTimer.current);
			}
			if (!timeout || now - timestamp.current < timeout) {
				timestamp.current = now;
				localStorage.setItem(key, JSON.stringify(value));
			} else {
				tail.current = value;
				tailTimer.current = setTimeout(() => {
					timestamp.current = now;
					tailTimer.current = undefined;
					localStorage.setItem(key, JSON.stringify(value));
				}, timeout);
			}
		},
		[key, timeout]
	);

	return [value, setValue];
};
