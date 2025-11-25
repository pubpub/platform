import type { LucideProps } from "lucide-react";
import React from "react";
import { cn } from "utils";
import * as Icons from "./icon";

export type IconConfig = {
	name: IconName;
	variant?: "solid" | "outline";
	color?: string;
};

type DynamicIconProps = {
	icon: IconConfig | null | undefined;
	fallback?: Icons.LucideIcon;
	size?: number | string;
	className?: string;
} & Omit<LucideProps, "size" | "color" | "className">;

// biome-ignore format: don't format
export const ICON_MAP = {'activity': Icons.Activity, 'alert-circle': Icons.AlertCircle, 'align-center': Icons.AlignCenter, 'align-left': Icons.AlignLeft, 'align-right': Icons.AlignRight, 'align-vertical-space-around': Icons.AlignVerticalSpaceAround, 'archive': Icons.Archive, 'archive-restore': Icons.ArchiveRestore, 'arrow-left': Icons.ArrowLeft, 'arrow-right': Icons.ArrowRight, 'badge-check': Icons.BadgeCheck, 'book': Icons.Book, 'book-dashed': Icons.BookDashed, 'bookmark': Icons.Bookmark, 'book-open': Icons.BookOpen, 'book-open-text': Icons.BookOpenText, 'bot': Icons.Bot, 'box-select': Icons.BoxSelect, 'calendar': Icons.Calendar, 'calendar-clock': Icons.CalendarClock, 'case-sensitive': Icons.CaseSensitive, 'check': Icons.Check, 'check-circle': Icons.CheckCircle, 'check-square': Icons.CheckSquare, 'chevron-down': Icons.ChevronDown, 'chevron-right': Icons.ChevronRight, 'chevron-left': Icons.ChevronLeft, 'chevron-up': Icons.ChevronUp, 'chevrons-up-down': Icons.ChevronsUpDown, 'circle-check': Icons.CircleCheck, 'circle-dashed': Icons.CircleDashed, 'circle-dollar-sign': Icons.CircleDollarSign, 'circle-dot': Icons.CircleDot, 'circle-ellipsis': Icons.CircleEllipsis, 'circle-help': Icons.CircleHelp, 'circle-slash': Icons.CircleSlash, 'clipboard': Icons.Clipboard, 'clipboard-pen-line': Icons.ClipboardPenLine, 'cloud': Icons.Cloud, 'contact': Icons.Contact, 'curly-braces': Icons.CurlyBraces, 'download': Icons.Download, 'ellipsis': Icons.Expand, 'external-link': Icons.ExternalLink, 'file-text': Icons.FileText, 'flag-triangle-right': Icons.FlagTriangleRightIcon, 'form-input': Icons.FormInput, 'globe': Icons.Globe, 'grip-vertical': Icons.GripVertical, 'heading-2': Icons.Heading2, 'heading-3': Icons.Heading3, 'help-circle': Icons.HelpCircle, 'history': Icons.History, 'image-plus': Icons.ImagePlus, 'info': Icons.Info, 'layers-3': Icons.Layers3, 'link': Icons.Link, 'list-plus': Icons.ListPlus, 'loader-2': Icons.Loader2, 'lock': Icons.Lock, 'log-out': Icons.LogOut, 'mail': Icons.Mail, 'menu': Icons.Menu, 'minus': Icons.Minus, 'more-vertical': Icons.MoreVertical, 'move-horizontal': Icons.MoveHorizontal, 'pencil': Icons.Pencil, 'play': Icons.Play, 'plus': Icons.Plus, 'plus-circle': Icons.PlusCircle, 'refresh-cw': Icons.RefreshCw, 'search': Icons.Search, 'send': Icons.Send, 'settings': Icons.Settings, 'settings-2': Icons.Settings2, 'table': Icons.Table, 'terminal': Icons.Terminal, 'toy-brick': Icons.ToyBrick, 'trash': Icons.Trash, 'trash-2': Icons.Trash2, 'triangle-alert': Icons.TriangleAlert, 'type': Icons.Type, 'undo-2': Icons.Undo2, 'user': Icons.User, 'user-check': Icons.UserCheck, 'user-circle-2': Icons.UserCircle2, 'user-plus': Icons.UserPlus, 'user-round-cog': Icons.UserRoundCog, 'users': Icons.Users, 'users-round': Icons.UsersRound, 'wand-2': Icons.Wand2, 'x': Icons.X, 'x-circle': Icons.XCircle,
} satisfies Record<string, Icons.LucideIcon>;

export type IconName = keyof typeof ICON_MAP;
export type IconMap = typeof ICON_MAP;

export const DynamicIcon = ({
	icon,
	fallback = Icons.Bot,
	size = 16,
	className,
	...props
}: DynamicIconProps) => {
	if (!icon?.name) {
		const FallbackIcon = fallback;
		return <FallbackIcon size={size} className={cn(className)} {...props} />;
	}

	const IconComponent = ICON_MAP[icon.name];

	if (!IconComponent) {
		const FallbackIcon = fallback;
		return (
			<FallbackIcon
				size={size}
				className={cn(className, icon.variant === "solid" && "fill-current")}
				{...props}
			/>
		);
	}

	return (
		<IconComponent
			size={size}
			className={cn(className, icon.variant === "solid" && "fill-current")}
			style={icon.color ? { color: icon.color } : undefined}
			{...props}
		/>
	);
};
