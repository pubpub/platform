import React from "react";

export function Circle({ text }: { text: string }) {
	return (
		<div className="w-28px h-28px bg-gray-500 rounded-full flex justify-center items-center">
			<p className="text-white text-base p-1">{text}</p>
		</div>
	);
}
