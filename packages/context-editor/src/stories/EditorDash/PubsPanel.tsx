import type { EditorState } from "prosemirror-state";

import React, { useMemo, useState } from "react";
import JsonView from "@uiw/react-json-view";

import { getPubValues } from "../../utils/pubValues";
import initialPubs from "../initialPubs.json";
import initialTypes from "../initialTypes.json";

const getPubTypeName = (pubTypeId: string) => {
	return initialTypes.find((type) => {
		return type.id === pubTypeId;
	})?.name;
};

const PubList = (props: any) => {
	return props.list.map((item: any) => {
		return (
			<div className="truncate pl-8" key={item.pubId || item.id}>
				<span className="font-bold">{getPubTypeName(item.pubTypeId)}</span>:{" "}
				{/* {item.id || item.pubId} */}
				{item.values["rd:title"] || item.values["rd:source"]}
				{/* {Object.keys(item.values).map((key)=>{
					return <div className="pl-8 truncate" key={key}><span className="">{key}</span>: {item.values[key]}</div>
				})} */}
			</div>
		);
	});
};

function filterDuplicatesById(arr: any[]) {
	const seenIds = new Set();

	return arr.filter((obj) => {
		const id = obj.pubId || obj.id;
		if (seenIds.has(id)) {
			return false; // Duplicate found, filter it out
		} else {
			seenIds.add(id); // First occurrence, keep it
			return true;
		}
	});
}

type Props = {
	editorState: EditorState;
	pubId: string;
};

export default function PubsPanel({ editorState, pubId }: Props) {
	const pubValues: { [key: string]: any } = getPubValues(editorState, pubId);
	const allPubs = filterDuplicatesById([...initialPubs, ...Object.values(pubValues)]);

	return (
		<>
			<h2 className="sticky left-0 top-0">Pubs</h2>
			<div className="panel-content">
				<div className="mb-2 font-bold">Context</div>
				<PubList list={allPubs} pubId={pubId} />

				<div className="mb-2 mt-8 font-bold">Updates Pubs</div>
				{Object.keys(pubValues).map((key) => {
					return (
						<div key={key} className="mb-8 rounded border border-neutral-400">
							<div className="border-b border-neutral-400 bg-neutral-200 p-2">
								<span className="font-bold">
									{getPubTypeName(pubValues[key].pubTypeId)}
								</span>
								: {key}
							</div>
							<div className="p-2">
								<JsonView
									value={pubValues[key]}
									displayDataTypes={false}
									displayObjectSize={false}
									enableClipboard={false}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
