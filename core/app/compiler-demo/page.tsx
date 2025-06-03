"use client";

import React, { useState } from "react";

function SlowComponent(props: { unused?: any }) {
	const largeArray = Array.from({ length: 10000 }, (_, i) => i);

	return (
		<div className="flex flex-wrap gap-1 overflow-scroll">
			{largeArray.map((value) => (
				<div
					key={value}
					className="h-2 w-2 bg-neutral-700"
					style={{
						backgroundColor: `rgb(${value % 255}, ${(value * 2) % 255}, ${(value * 3) % 255})`,
					}}
				></div>
			))}
		</div>
	);
}

function CounterButton(props: { onClick: () => void }) {
	return (
		<button
			onClick={props.onClick}
			className="rounded border border-white/20 bg-neutral-700 px-4 py-2 text-white hover:bg-neutral-600"
		>
			Increase count
		</button>
	);
}

function ColorPicker(props: { value: string; onChange: (value: string) => void }) {
	return (
		<input
			type="color"
			value={props.value}
			onChange={(e) => props.onChange(e.target.value)}
			className="h-12 w-full cursor-pointer rounded border border-white/20 bg-neutral-700 p-1"
		/>
	);
}

export function DemoComponent() {
	const [count, setCount] = useState(0);
	const [color, setColor] = useState("#ffffff");

	return (
		<div className={`flex gap-8`}>
			<div className="flex h-64 w-96 flex-col gap-4 border border-white p-4">
				<h2 className="mb-8 text-center text-xl font-bold">Color Picker</h2>
				<ColorPicker value={color} onChange={(e) => setColor(e)} />
				<div className="mt-2">
					Current value: <br />
					<span className="font-mono">{color}</span>
				</div>
			</div>
			<div className="flex h-64 w-96 flex-col gap-4 border border-white p-4">
				<h2 className="mb-8 text-center text-xl font-bold">Counter</h2>
				<CounterButton onClick={() => setCount((count) => count + 1)} />
				<div className="mt-2">
					Current value: <br />
					<span className="font-mono">{count}</span>
				</div>
			</div>
			<div className="flex h-64 w-96 flex-col gap-2 border border-white p-4">
				<h2 className="text-center text-xl font-bold">A Slow Component</h2>
				<span className="text-center font-light text-neutral-200">
					(This component renders 10,000 boxes)
				</span>
				<SlowComponent unused={{ name: "nope" }} />
			</div>
		</div>
	);
}
export default function Demo() {
	return (
		<div className="flex min-h-screen flex-col">
			<h1 className="py-8 text-center text-2xl font-bold">React Compiler Demo</h1>
			<p className="text-center text-sm text-neutral-400">
				Turn off the compiler in <code>next.config.ts</code> to see the difference.
			</p>
			<p className="text-center text-sm text-neutral-400">
				Picking a color should be really slow with the compiler turned off
			</p>

			<div className={`flex flex-grow items-center justify-center`}>
				<DemoComponent />
			</div>
		</div>
	);
}
