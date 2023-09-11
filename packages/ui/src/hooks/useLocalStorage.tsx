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
	const timestamp = React.useRef(performance.now());
	const { prefix, timeout } = React.useContext(LocalStorageContext);
	key = React.useMemo(() => prefix + key, []);
	const value = React.useMemo<T | undefined>(() => {
		const item = localStorage.getItem(key);
		if (item) {
			return JSON.parse(item);
		}
		return undefined;
	}, []);
	const tail = React.useRef<() => void>();
	const tailTimer = React.useRef<ReturnType<typeof setTimeout>>();
	const setValue = React.useCallback(
		(value: T) => {
			const now = performance.now();
			const write = () => {
				timestamp.current = now;
				localStorage.setItem(key, JSON.stringify(value));
			};
			if (tailTimer.current) {
				clearTimeout(tailTimer.current);
			}
			if (!timeout || now - timestamp.current < timeout) {
				write();
			} else {
				tail.current = write;
				tailTimer.current = setTimeout(() => {
					tail.current?.();
					tailTimer.current = undefined;
				}, timeout);
			}
		},
		[key, timeout]
	);
	return [value, setValue];
};
