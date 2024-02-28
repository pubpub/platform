import React from "react";

export function Circle({ text }: { text: string }) {
	return (
		<span className="relative w-20px h-20px flex justify-center items-center">
			<span className="absolute bg-gray-500 rounded-full w-full h-full"></span>
			<p className="relative z-10 text-white text-sm p-1">{text}</p>
		</span>
	);
}
