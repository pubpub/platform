import React from "react"

function AutoFormTooltip({ fieldConfigItem }: { fieldConfigItem: any }) {
	return (
		<>
			{fieldConfigItem?.description && (
				<p className="text-gray-500 text-sm dark:text-white">
					{fieldConfigItem.description}
				</p>
			)}
		</>
	)
}

export default AutoFormTooltip
