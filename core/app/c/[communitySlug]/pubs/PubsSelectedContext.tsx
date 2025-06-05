"use client";

import type { PropsWithChildren } from "react";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { PubsId } from "db/public";

type PubsSelectedContext = {
	isSelected: (pubId: PubsId) => boolean;
	toggle: (pubId: PubsId) => void;
	numSelected: number;
};

const PubsSelectedContext = createContext<PubsSelectedContext>({
	isSelected: () => false,
	toggle: () => {},
	numSelected: 0,
});

type Props = PropsWithChildren<{
	pubIds: PubsId[];
}>;

export const PubsSelectedProvider = (props: Props) => {
	const [selectedPubs, setSelectedPubs] = useState(new Set(props.pubIds));

	const isSelected = useCallback(
		(pubId: PubsId) => {
			return selectedPubs.has(pubId);
		},
		[selectedPubs]
	);

	const toggle = useCallback(
		(pubId: PubsId) => {
			const nextSelectedPubs = new Set(selectedPubs);
			if (nextSelectedPubs.has(pubId)) {
				nextSelectedPubs.delete(pubId);
			} else {
				nextSelectedPubs.add(pubId);
			}
			setSelectedPubs(nextSelectedPubs);
		},
		[selectedPubs]
	);

	const value = useMemo(
		() => ({ isSelected, toggle, numSelected: selectedPubs.size }),
		[toggle, selectedPubs]
	);

	return (
		<PubsSelectedContext.Provider value={value}>{props.children}</PubsSelectedContext.Provider>
	);
};

export const usePubsSelectedContext = () => useContext(PubsSelectedContext);
