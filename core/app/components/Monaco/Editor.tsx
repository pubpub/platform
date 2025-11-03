import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { cn } from "utils";

export const Editor = ({
	className,
	language = "json",
	value = '{ "hello": "world" }',
}: {
	className?: string;
	language?: string;
	value?: string;
}) => {
	const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoEl = useRef(null);

	useEffect(() => {
		if (monacoEl) {
			setEditor((editor) => {
				if (editor) return editor;

				return monaco.editor.create(monacoEl.current!, {
					value: '{ "hello": "world" }',
					language: "json",
				});
			});
		}

		return () => editor?.dispose();
	}, [monacoEl.current]);

	return (
		<div
			className={cn("h-96 overflow-scroll [&_.monaco-editor]:!h-96", className)}
			ref={monacoEl}
		></div>
	);
};
