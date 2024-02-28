import React from "react";

export function Circle({ text }: { text: string }) {
	return (
		<span className="w-20px h-20px bg-gray-500 rounded-full flex justify-center items-center">
			<p className="text-white text-sm p-1">{text}</p>
		</span>
	);
}
