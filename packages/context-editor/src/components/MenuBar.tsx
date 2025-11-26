import type { LucideProps } from "lucide-react"
import type { ReactNode } from "react"
import type { CommandSpec } from "../commands/types"
import type { Upload } from "./ImageUploader"

import * as React from "react"
import { Fragment, useState } from "react"
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror"
import {
	Bold,
	Code,
	CodeSquare,
	ImagePlus,
	Italic,
	Link,
	List,
	ListOrdered,
	Quote,
	Radical,
	SeparatorHorizontal,
	SquareRadical,
	Strikethrough,
	Subscript,
	Superscript,
	Table,
	Underline,
} from "lucide-react"

import { Button } from "ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select"
import { cn } from "utils"

import {
	blockquoteToggle,
	bulletListToggle,
	codeBlockToggle,
	heading1Toggle,
	heading2Toggle,
	heading3Toggle,
	heading4Toggle,
	heading5Toggle,
	heading6Toggle,
	orderedListToggle,
	paragraphToggle,
} from "../commands/blocks"
import { insertHorizontalLine } from "../commands/horizontal"
import { isImageActive as isImageActiveCommand } from "../commands/images"
import {
	codeToggle,
	emToggle,
	linkToggle,
	strikethroughToggle,
	strongToggle,
	subscriptToggle,
	superscriptToggle,
	underlineToggle,
} from "../commands/marks"
import { mathToggleBlock, mathToggleInline } from "../commands/math"
import { insertTable } from "../commands/tables"
import { ImageUploader } from "./ImageUploader"

export const MENU_BAR_HEIGHT = 56

type MenuItem = {
	key: string
	name: string
	icon: ReactNode
	command: CommandSpec
}

const iconProps: LucideProps = {
	strokeWidth: "1px",
}

const menuBlocks: MenuItem[][] = [
	[
		{
			key: "strong",
			name: "Bold",
			icon: <Bold {...iconProps} />,
			command: strongToggle,
		},
		{
			key: "em",
			name: "Italic",
			icon: <Italic {...iconProps} />,
			command: emToggle,
		},
		{
			key: "underline",
			name: "Underline",
			icon: <Underline {...iconProps} />,
			command: underlineToggle,
		},
		{
			key: "del",
			name: "Strikethrough",
			icon: <Strikethrough {...iconProps} />,
			command: strikethroughToggle,
		},
		{
			key: "sub",
			name: "Subscript",
			icon: <Subscript {...iconProps} />,
			command: subscriptToggle,
		},
		{
			key: "sup",
			name: "Superscript",
			icon: <Superscript {...iconProps} />,
			command: superscriptToggle,
		},
	],
	[
		{
			key: "horizontal_rule",
			name: "Horizontal line",
			icon: <SeparatorHorizontal {...iconProps} />,
			command: insertHorizontalLine,
		},
		{
			key: "bullet_list",
			name: "Bullet list",
			icon: <List {...iconProps} />,
			command: bulletListToggle,
		},
		{
			key: "ordered_list",
			name: "Ordered list",
			icon: <ListOrdered {...iconProps} />,
			command: orderedListToggle,
		},
	],
	[
		{ key: "link", name: "Link", icon: <Link {...iconProps} />, command: linkToggle },
		{
			key: "table",
			name: "Table",
			icon: <Table {...iconProps} />,
			command: insertTable,
		},
		{
			key: "blockquote",
			name: "Blockquote",
			icon: <Quote {...iconProps} />,
			command: blockquoteToggle,
		},
		{
			key: "inline-code",
			name: "Inline code",
			icon: <Code {...iconProps} />,
			command: codeToggle,
		},
		{
			key: "block-code",
			name: "Block code",
			icon: <CodeSquare {...iconProps} />,
			command: codeBlockToggle,
		},
		{
			key: "inline-math",
			name: "Inline math",
			icon: <Radical {...iconProps} />,
			command: mathToggleInline,
		},
		{
			key: "block-math",
			name: "Block math",
			icon: <SquareRadical {...iconProps} />,
			command: mathToggleBlock,
		},
	],
]

const paragraphTypeItems: MenuItem[] = [
	{
		key: "paragraph",
		name: "Paragraph",
		icon: <span className="font-serif">Paragraph</span>,
		command: paragraphToggle,
	},
	{
		key: "h1",
		name: "Heading 1",
		icon: <span className="font-bold font-serif text-3xl">Heading 1</span>,
		command: heading1Toggle,
	},
	{
		key: "h2",
		name: "Heading 2",
		icon: <span className="font-bold font-serif text-2xl">Heading 2</span>,
		command: heading2Toggle,
	},
	{
		key: "h3",
		name: "Heading 3",
		icon: <span className="font-serif text-xl">Heading 3</span>,
		command: heading3Toggle,
	},
	{
		key: "h4",
		name: "Heading 4",
		icon: <span className="font-serif text-lg">Heading 4</span>,
		command: heading4Toggle,
	},
	{
		key: "h5",
		name: "Heading 5",
		icon: <span className="font-serif text-base">Heading 5</span>,
		command: heading5Toggle,
	},
	{
		key: "h6",
		name: "Heading 6",
		icon: <span className="font-normal font-serif text-sm">Heading 6</span>,
		command: heading6Toggle,
	},
]

const ParagraphDropdown = () => {
	const itemCommand = useEditorEventCallback((view, item: MenuItem) => {
		if (!view) return
		return item.command(view)(view.state)
	})

	const activeType = paragraphTypeItems.find((item) => itemCommand(item)?.isActive)

	const handleValueChange = useEditorEventCallback((view, value: string) => {
		if (!view) return
		const item = paragraphTypeItems.find((i) => i.key === value)
		if (!item) {
			return
		}

		const { run } = item.command(view)(view.state)
		view.focus()
		run()
	})

	return (
		<Select
			value={activeType?.key}
			onValueChange={(value) => {
				handleValueChange(value)
			}}
			disabled={!activeType}
		>
			<SelectTrigger className="flex h-6 w-fit gap-1 border-none bg-transparent p-0 font-serif">
				<SelectValue placeholder="Paragraph">
					{activeType ? activeType.name : "Paragraph"}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className="bg-white">
				{paragraphTypeItems.map(({ key, icon }) => {
					return (
						<SelectItem key={key} value={key}>
							{icon}
						</SelectItem>
					)
				})}
			</SelectContent>
		</Select>
	)
}

const ImagePopoverMenuItem = ({ upload }: { upload: Upload }) => {
	const [isOpen, setIsOpen] = useState(false)
	const isImageActive = useEditorEventCallback((view) => {
		if (!view) return false
		return isImageActiveCommand(view.state)
	})
	const isActive = isImageActive()
	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					title="Image"
					className={cn("h-fit rounded-xs p-1", {
						"bg-blue-200 hover:bg-blue-300": isActive,
					})}
				>
					<ImagePlus {...iconProps} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-72">
				<ImageUploader
					upload={upload}
					onInsert={() => {
						setIsOpen(false)
					}}
				/>
			</PopoverContent>
		</Popover>
	)
}

const MenuItemButton = ({ menuItem }: { menuItem: MenuItem }) => {
	const { key, name, icon } = menuItem

	const itemCommand = useEditorEventCallback((view) => {
		if (!view) return
		return menuItem.command(view)(view.state)
	})
	const cmdResult = itemCommand()
	const { canRun, isActive } = cmdResult ?? { canRun: false, isActive: false }

	const handleClick = useEditorEventCallback((view) => {
		if (!view) return
		view.focus()
		const { run } = menuItem.command(view)(view.state)
		run()
	})

	return (
		<Button
			key={key}
			onClick={handleClick}
			variant="ghost"
			size="sm"
			disabled={!canRun}
			type="button"
			className={cn("h-fit rounded-xs p-1", {
				"bg-blue-200 hover:bg-blue-300": isActive,
			})}
			title={name}
			aria-pressed={isActive}
		>
			{icon}
		</Button>
	)
}

const Separator = () => {
	return (
		<div className="flex items-center px-4">
			<div className="h-6 w-px bg-gray-300" />
		</div>
	)
}

export const MenuBar = ({ upload }: { upload: Upload }) => {
	return (
		<div
			className="flex items-center overflow-x-auto rounded-t border bg-gray-50 p-4"
			role="toolbar"
			aria-label="Formatting tools"
			style={{ height: `${MENU_BAR_HEIGHT}px` }}
		>
			<div className="flex pl-2">
				<ParagraphDropdown />
				<Separator />
			</div>
			<div className="flex items-center">
				{menuBlocks.map((menuBlock, index) => {
					return (
						<Fragment key={index}>
							<div className={cn("flex items-center gap-1")}>
								{menuBlock.map((menuItem) => {
									return <MenuItemButton key={menuItem.key} menuItem={menuItem} />
								})}
							</div>
							<Separator />
						</Fragment>
					)
				})}
			</div>
			<div className="flex items-center">
				<ImagePopoverMenuItem upload={upload} />
			</div>
		</div>
	)
}
