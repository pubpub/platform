import React, { useMemo, useState } from "react";
import {getPubValues} from '../../utils/pubValues';
import JsonView from '@uiw/react-json-view';

export default function PubsPanel({ editorState }) {
	const pubValues = getPubValues(editorState)
	console.log(pubValues);
	return (
		<>
			<h2 className="sticky left-0 top-0">Pubs</h2>
			<div className="panel-content">
				<JsonView
					value={pubValues}
					displayDataTypes={false}
					displayObjectSize={false}
					enableClipboard={false}
				/>
			</div>
		</>
	);
}
