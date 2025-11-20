import type { ControllerRenderProps, FieldValues } from "react-hook-form"

import { Textarea } from "ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

import { extractJsonata, wrapInJsonata } from "./schemaWithJsonFields"

export type InputState =
	| {
			state: "jsonata"
			jsonValue: string
			normalValue: string
	  }
	| {
			state: "normal"
			normalValue: string
			jsonValue: string
	  }

export function ActionFieldJsonataInput(props: {
	field: ControllerRenderProps<FieldValues, any>
	isDefaultField: boolean
	actionAccepts: readonly string[]
	"aria-labelledby": string
}) {
	const { field, actionAccepts } = props

	const isDefaultField = field.value === undefined

	return (
		<div className="relative">
			<div className="absolute top-0 right-0 z-10">
				<span className="flex items-center gap-1 rounded-tr-sm rounded-bl-sm border-amber-400 border-b border-l bg-amber-100 px-1.5 py-1.5 font-medium text-amber-800 text-xs">
					<Tooltip delayDuration={500}>
						<TooltipTrigger className="underline decoration-dashed">
							JSONata
						</TooltipTrigger>
						{/* TODO: write actual docs */}
						<TooltipContent className="prose max-w-sm text-xs">
							You can write
							<a
								href="https://jsonata.org/"
								target="_blank"
								rel="noreferrer"
								className="font-bold underline"
							>
								JSONata
							</a>{" "}
							expressions to select data from the{" "}
							{actionAccepts.includes("pub") ? `current Pub.` : `JSON payload`}.
							<br />
							Eg select the title of the current Pub: <code>$.title</code>
							{" or "}
							<code>$.values.title</code>
							<br />
							Or select the first title from related Pubs on the Evaluations field
							which have "Status: 'in review":{" "}
							<code>$.out.evaluations[Status='in review'][0].title</code>
						</TooltipContent>
					</Tooltip>
				</span>
			</div>
			<Textarea
				aria-labelledby={props["aria-labelledby"]}
				className="border-amber-400 bg-amber-50/10 font-medium font-mono text-gray-900 focus:border-amber-400 focus-visible:ring-amber-400"
				placeholder={isDefaultField ? "(use default)" : undefined}
				{...field}
				id={field.name}
				value={field.value ? extractJsonata(field.value) : ""}
				onChange={(e) => {
					const wrappedValue = wrapInJsonata(e.target.value)
					field.onChange(wrappedValue)
				}}
			/>
		</div>
	)
}
