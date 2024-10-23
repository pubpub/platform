import React, { useMemo, useState } from "react";
import JsonView from "@uiw/react-json-view";

import { getPubValues } from "../../../../../packages/context-editor/src/utils/pubValues";
import initialPubs from "../initialPubs.json";
import initialTypes from "../initialTypes.json";

const getPubTypeName = (pubTypeId) => {
	return initialTypes.find((type) => {
		return type.id === pubTypeId;
	})?.name;
};

function buildNestedList(pubs) {
	// Create a map to hold references to each object by its id
	const pubMap = {};

	// Loop through the list again to build the hierarchy
	pubs.forEach((pub) => {
		const parentId = pub.parentId || pub.parentPubId;

		if (!parentId) {
			pubMap[pub.id] = { ...pub, children: [] };
		}
		// 	// If there's a parentId, push the current object into its parent's children array
		// 	objectMap[parentId].children.push(objectMap[obj.id]);
		// } else {
		// 	// If there's no parentId, it is a root object and should be added to the result array
		// 	result.push(objectMap[obj.id]);
		// }
	});

	pubs.forEach((pub) => {
		const parentId = pub.parentId || pub.parentPubId;

		if (parentId) {
			pubMap[parentId].children.push(pub);
		}
	});

	return Object.values(pubMap);
}

const PubList = (props) => {
	return props.list.map((item) => {
		return (
			<div className="truncate pl-8" key={item.pubId || item.id}>
				<span className="font-bold">{getPubTypeName(item.pubTypeId)}</span>:{" "}
				{/* {item.id || item.pubId} */}
				{item.values["rd:title"] || item.values["rd:source"]}
				{/* {Object.keys(item.values).map((key)=>{
					return <div className="pl-8 truncate" key={key}><span className="">{key}</span>: {item.values[key]}</div>
				})} */}
				{item.children && <PubList list={item.children} />}
			</div>
		);
	});
};

function filterDuplicatesById(arr) {
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

export default function PubsPanel({ editorState, pubId }) {
	const pubValues = getPubValues(editorState, pubId);
	const allPubs = filterDuplicatesById([...initialPubs, ...Object.values(pubValues)]);
	// console.log("allPubs", allPubs);
	const nestedPubs = buildNestedList(allPubs);

	return (
		<>
			<h2 className="sticky left-0 top-0">Pubs</h2>
			<div className="panel-content">
				<div className="mb-2 font-bold">Context</div>
				<PubList list={nestedPubs} pubId={pubId} />

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
