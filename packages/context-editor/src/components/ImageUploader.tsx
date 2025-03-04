import React, { useState } from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";

import type { FormattedFile } from "ui/customRenderers/fileUpload/fileUpload";
import { Button } from "ui/button";
import { FileUpload } from "ui/customRenderers/fileUpload/fileUpload";
import { Input } from "ui/input";

import type { ImageAttrs } from "../schemas/image";
import { insertNodeIntoEditor } from "../utils/nodes";

const fakeFile: FormattedFile = {
	id: "test",
	fileName: "cat.jpeg",
	fileSource: "https://placecats.com/300/200",
	fileType: "",
	fileMeta: {},
	fileSize: 100,
};

export const ImageUploader = () => {
	const { view } = usePluginViewContext();
	const [url, setUrl] = useState("");

	const onUpload = (files: FormattedFile[]) => {
		for (const file of files) {
			const attrs: ImageAttrs = {
				src: file.fileSource,
				id: file.id, // maybe?
				class: null,
				alt: "",
				linkTo: "",
				credit: null,
				license: null,
				width: 100,
				align: "center",
			};
			insertNodeIntoEditor(view.state, view.dispatch, "image", attrs);
		}
	};

	return (
		<div className="flex gap-2">
			{/* Temporary form while figuring out FileUpload
			The Button onClick should be able to be passed into onUpdateFiles */}
			<Input
				type="text"
				value={url}
				onChange={(evt) => {
					setUrl(evt.target.value);
				}}
				placeholder="url to an image"
			/>
			<Button
				onClick={() => {
					onUpload([
						{ ...fakeFile, fileSource: url },
						{ ...fakeFile, fileSource: "https://placecats.com/neo/300/200" },
					]);
				}}
			>
				insert
			</Button>
			{/* TODO: figure out how to do signed uploads here */}
			{/* <FileUpload
				upload={(filename) => {
					console.log({ filename });
					// TODO: how best to get signed upload here?
					return Promise.resolve("test");
				}}
				onUpdateFiles={(event) => {
					console.log({ event });
				}}
			/> */}
		</div>
	);
};
