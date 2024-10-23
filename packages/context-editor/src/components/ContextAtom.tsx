import React, { Suspense, useEffect, useState } from "react";
import { useNodeViewContext } from "@prosemirror-adapter/react";
import { CsvToHtmlTable } from "react-csv-to-table";

export default function ContextAtom({ nodeProp }: { nodeProp: Node}) {
	const { contentRef, node, selected } = useNodeViewContext();
	const [activeData, setActiveData] = useState("");
	const activeNode = nodeProp || node;
	if (!activeNode) {
		return null;
	}

	const isImageUrl = (url: string) => {
		// Regular expression to match common image file extensions
		const imagePattern = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;

		// Test the string against the pattern
		return imagePattern.test(url);
	};
	const isVideoUrl = (url: string) => {
		// Regular expression to match common video file extensions
		const videoPattern = /\.(mp4|avi|mkv|webm|mov|flv|wmv|m4v)$/i;

		// Test the string against the pattern
		return videoPattern.test(url);
	};
	function isAudioUrl(url: string) {
		// Regular expression to match common audio file extensions
		const audioPattern = /\.(mp3|wav|ogg|m4a|flac|aac|aiff)$/i;

		// Test the string against the pattern
		return audioPattern.test(url);
	}
	function isDataUrl(url: string) {
		// Regular expression to match common audio file extensions
		const audioPattern = /\.(csv)$/i;

		// Test the string against the pattern
		return audioPattern.test(url);
	}
	const isDataset = activeNode.attrs.pubTypeId === "6db3e01b-5391-413b-97e2-155e00e396c9";

	useEffect(() => {
		if (isDataset && isDataUrl(activeNode.attrs.data["rd:source"])) {
			// console.log("ok");
			fetch(activeNode.attrs.data["rd:source"])
				.then((r) => r.text())
				.then((text) => {
					setActiveData(text);
				});
		}
	}, [node]);
	// console.log(activeNode, activeNode.attrs.data["rd:source"]);
	return (
		<section
			style={{ outline: selected ? "1px solid #777" : "none" }}
			role="presentation"
			ref={contentRef}
		>
			{activeNode.attrs.pubTypeId === "9956ccd9-50b5-42b1-a14b-199eb26f2a12" && (
				<>
					{!activeNode.attrs.data["rd:source"] && (
						<div className="rounded bg-neutral-200 p-8 text-center">
							Add Media Source
						</div>
					)}
					{activeNode.attrs.data["rd:source"] &&
						isImageUrl(activeNode.attrs.data["rd:source"]) && (
							<img
								src={activeNode.attrs.data["rd:source"]}
								alt={activeNode.attrs.data["rd:alt"]}
							/>
						)}
					{activeNode.attrs.data["rd:source"] &&
						isVideoUrl(activeNode.attrs.data["rd:source"]) && (
							<video width="640" height="360" controls>
								<source src={activeNode.attrs.data["rd:source"]} />
							</video>
						)}
					{activeNode.attrs.data["rd:source"] &&
						isAudioUrl(activeNode.attrs.data["rd:source"]) && (
							<audio controls>
								<source src={activeNode.attrs.data["rd:source"]} />
							</audio>
						)}
				</>
			)}
			{isDataset && (
				<>
					{!activeNode.attrs.data["rd:source"] && !activeNode.attrs.data["rd:data"] && (
						<div className="rounded bg-neutral-200 p-8 text-center">
							Add Data Source
						</div>
					)}
					{(activeNode.attrs.data["rd:source"] || activeNode.attrs.data["rd:data"]) && (
						<CsvToHtmlTable
							data={activeNode.attrs.data["rd:data"] || activeData}
							csvDelimiter=","
							tableClassName="dataset"
						/>
					)}
				</>
			)}

			{/* {JSON.stringify(activeNode, null, 2)} */}
		</section>
	);
}
