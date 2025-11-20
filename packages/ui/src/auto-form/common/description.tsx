import React from "react"

import { cn } from "utils"

import { FormDescription } from "../../form"

function AutoFormDescription({
	description,
	className,
}: {
	description: string
	className?: string
}) {
	return <FormDescription className={cn(className)}>{description}</FormDescription>
}

export default AutoFormDescription
