import type { LucideProps } from "lucide-react";
import type { ReactNode } from "react";

import React, { Fragment, useState } from "react";
import { usePluginViewContext } from "@prosemirror-adapter/react";
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
} from "lucide-react";

import { Button } from "ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { cn } from "utils";

import type { CommandSpec } from "../commands/types";
import type { Upload } from "./ImageUploader";
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
} from "../commands/blocks";
import { insertHorizontalLine } from "../commands/horizontal";
import { isImageActive } from "../commands/images";
import {
	codeToggle,
	emToggle,
	linkToggle,
	strikethroughToggle,
	strongToggle,
} from "../commands/marks";
import { mathToggleBlock, mathToggleInline } from "../commands/math";
import { ImageUploader } from "./ImageUploader";

type MenuItem = {
	key: string;
	name: string;
	icon: ReactNode;
	command: CommandSpec;
};

const iconProps: LucideProps = {
	strokeWidth: "1px",
};

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
			key: "del",
			name: "Strikethrough",
			icon: <Strikethrough {...iconProps} />,
			command: strikethroughToggle,
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
];

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
		icon: <span className="font-serif text-3xl font-bold">Heading 1</span>,
		command: heading1Toggle,
	},
	{
		key: "h2",
		name: "Heading 2",
		icon: <span className="font-serif text-2xl font-bold">Heading 2</span>,
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
		icon: <span className="font-serif text-sm font-normal">Heading 6</span>,
		command: heading6Toggle,
	},
];

const ParagraphDropdown = () => {
	const { view } = usePluginViewContext();
	const activeType = paragraphTypeItems.find((item) => item.command(view)(view.state).isActive);

	return (
		<Select
			value={activeType?.key}
			onValueChange={(value) => {
				const item = paragraphTypeItems.find((i) => i.key === value);
				if (!item) {
					return;
				}

				const { run } = item.command(view)(view.state);
				view.focus();
				run();
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
					);
				})}
			</SelectContent>
		</Select>
	);
};

const ImagePopoverMenuItem = ({ upload }: { upload: Upload }) => {
	const { view } = usePluginViewContext();
	const [isOpen, setIsOpen] = useState(false);
	const isActive = isImageActive(view.state);
	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					title="Image"
					className={cn("h-fit rounded-sm p-1", {
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
						setIsOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
};

const MenuItemButton = ({ menuItem }: { menuItem: MenuItem }) => {
	const { view } = usePluginViewContext();
	const { key, name, icon, command } = menuItem;
	const { run, canRun, isActive } = command(view)(view.state);
	return (
		<Button
			key={key}
			onClick={() => {
				view.focus();
				run();
			}}
			variant="ghost"
			size="sm"
			disabled={!canRun}
			type="button"
			className={cn("h-fit rounded-sm p-1", {
				"bg-blue-200 hover:bg-blue-300": isActive,
			})}
			title={name}
			aria-pressed={isActive}
		>
			{icon}
		</Button>
	);
};

const Separator = () => {
	return (
		<div className="flex items-center px-4">
			<div className="h-6 w-px bg-gray-300" />
		</div>
	);
};

export const MenuBar = ({ upload }: { upload: Upload }) => {
	return (
		<div
			className="flex items-center overflow-x-auto rounded-t border bg-gray-50 p-4"
			role="toolbar"
			aria-label="Formatting tools"
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
									return (
										<MenuItemButton key={menuItem.key} menuItem={menuItem} />
									);
								})}
							</div>
							<Separator />
						</Fragment>
					);
				})}
			</div>
			<div className="flex items-center">
				<ImagePopoverMenuItem upload={upload} />
			</div>
		</div>
	);
};
