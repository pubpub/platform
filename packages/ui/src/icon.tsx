import type { LucideIcon, LucideProps } from "lucide-react";

import React from "react";

import { cn } from "utils";

export {
	Activity,
	AlertCircle,
	AlignCenter,
	AlignLeft,
	AlignRight,
	AlignVerticalSpaceAround,
	Archive,
	ArchiveRestore,
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	BookDashed,
	Bookmark,
	BookOpen,
	BookOpenText,
	BoxSelect,
	Calendar,
	CalendarClock,
	CaseSensitive,
	Check,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ChevronRight,
	ChevronLeft,
	ChevronUp,
	ChevronsUpDown,
	CircleCheck,
	CircleDashed,
	CircleDollarSign,
	CircleDot,
	CircleEllipsis,
	CircleHelp,
	CircleSlash,
	Clipboard,
	ClipboardPenLine,
	Contact,
	CurlyBraces,
	Download,
	Ellipsis,
	Expand,
	ExternalLink,
	FileText,
	FlagTriangleRightIcon,
	FormInput,
	Globe,
	GripVertical,
	Heading2,
	Heading3,
	HelpCircle,
	History,
	ImagePlus,
	Info,
	Layers3,
	Link,
	ListPlus,
	Loader2,
	Lock,
	LogOut,
	Mail,
	Menu,
	Minus,
	MoreVertical,
	MoveHorizontal,
	Pencil,
	Play,
	Plus,
	PlusCircle,
	RefreshCw,
	Search,
	Send,
	Settings,
	Settings2,
	Table,
	Terminal,
	ToyBrick,
	Trash,
	TriangleAlert,
	Type,
	Undo2,
	User,
	UserCheck,
	UserCircle2,
	UserPlus,
	UserRoundCog,
	Users,
	UsersRound,
	Wand2,
	X,
	XCircle,
} from "lucide-react";

export type { LucideIcon } from "lucide-react";

export const Form = ({ className, size = 16, ...props }: LucideProps) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={cn("lucide", className)}
		{...props}
	>
		<rect width="8" height="4" x="8" y="2" rx="1" />
		<path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5" />
		<path d="M16 4h2a2 2 0 0 1 1.73 1" />
		<path d="M8 18h1" />
		<path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
	</svg>
);

export const Stages = ({ className, size = 16, ...props }: LucideProps) => (
	<svg
		className={cn("lucide", className)}
		width={size}
		height={Number(size) - Number(size) / 4}
		viewBox="0 0 17 12"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<g clipPath="url(#clip0_303_3701)">
			<path
				d="M9.80084 7.01646L6.79154 10.4554C6.66147 10.604 6.50113 10.7231 6.32128 10.8047C6.14143 10.8863 5.94621 10.9285 5.74871 10.9285C5.55121 10.9285 5.35599 10.8863 5.17614 10.8047C4.99629 10.7231 4.83595 10.604 4.70588 10.4554L1.69658 7.01646C1.47554 6.76384 1.3537 6.43957 1.3537 6.1039C1.3537 5.76822 1.47554 5.44396 1.69658 5.19133L4.70588 1.75243C4.83595 1.60381 4.99629 1.48471 5.17614 1.40311C5.35599 1.32151 5.55121 1.2793 5.74871 1.2793C5.94621 1.2793 6.14143 1.32151 6.32128 1.40311C6.50113 1.48471 6.66147 1.60381 6.79154 1.75243L9.80084 5.19133C10.0219 5.44396 10.1437 5.76822 10.1437 6.1039C10.1437 6.43957 10.0219 6.76384 9.80084 7.01646Z"
				stroke="black"
				strokeWidth="1.17795"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M9.21326 10.9541L12.5974 7.00595C12.8129 6.75474 12.9313 6.43472 12.9313 6.10378C12.9313 5.77284 12.8129 5.45282 12.5974 5.20161L9.21326 1.25342"
				stroke="black"
				strokeWidth="1.17795"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M11.9849 10.9541L15.3691 7.00595C15.5845 6.75474 15.703 6.43472 15.703 6.10378C15.703 5.77284 15.5845 5.45282 15.3691 5.20161L11.9849 1.25342"
				stroke="black"
				strokeWidth="1.17795"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</g>
		<defs>
			<clipPath id="clip0_303_3701">
				<rect
					width="15.9902"
					height="11.513"
					fill="white"
					transform="translate(0.525269 0.347412)"
				/>
			</clipPath>
		</defs>
	</svg>
);

export const Pub = ({ className, size = 16, ...props }: LucideProps) => (
	<svg
		className={cn("lucide", className)}
		width={size}
		height={size}
		viewBox="0 0 17 17"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<g clipPath="url(#clip0_303_3691)">
			<path
				d="M4.58336 4.17547H12.4573M4.58336 8.11245H12.4573M4.58336 12.0494H9.30774M14.0321 1.02588H3.00857C2.59091 1.02588 2.19035 1.19179 1.89502 1.48713C1.59969 1.78246 1.43378 2.18301 1.43378 2.60067V13.6242C1.43378 14.0419 1.59969 14.4424 1.89502 14.7378C2.19035 15.0331 2.59091 15.199 3.00857 15.199H14.0321C14.4498 15.199 14.8503 15.0331 15.1457 14.7378C15.441 14.4424 15.6069 14.0419 15.6069 13.6242V2.60067C15.6069 2.18301 15.441 1.78246 15.1457 1.48713C14.8503 1.19179 14.4498 1.02588 14.0321 1.02588Z"
				stroke="black"
				strokeWidth="1.33857"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</g>
		<defs>
			<clipPath id="clip0_303_3691">
				<rect
					width="15.9902"
					height="15.9902"
					fill="white"
					transform="translate(0.525269 0.117432)"
				/>
			</clipPath>
		</defs>
	</svg>
);

export const Integration = ({ className, size = 16, ...props }: LucideProps) => (
	<svg
		className={cn("lucide", className)}
		width={size}
		height={size}
		viewBox="0 0 16 15"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<g clipPath="url(#clip0_303_3708)">
			<path
				d="M0.742432 9.18557V5.04921C0.742432 3.95217 1.17823 2.90007 1.95394 2.12435C2.72966 1.34864 3.78176 0.912842 4.8788 0.912842H10.3939C11.491 0.912842 12.5431 1.34864 13.3188 2.12435C14.0945 2.90007 14.5303 3.95217 14.5303 5.04921V9.18557C14.5303 10.2826 14.0945 11.3347 13.3188 12.1104C12.5431 12.8861 11.491 13.3219 10.3939 13.3219H4.8788C3.78176 13.3219 2.72966 12.8861 1.95394 12.1104C1.17823 11.3347 0.742432 10.2826 0.742432 9.18557Z"
				stroke="black"
				strokeWidth="1.17197"
			/>
			<path
				d="M7.40679 4.35986L6.25757 7.11744H9.01514L7.86592 9.87501"
				stroke="black"
				strokeWidth="1.17197"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</g>
		<defs>
			<clipPath id="clip0_303_3708">
				<rect width="15.2727" height="14" fill="white" transform="translate(0 0.117432)" />
			</clipPath>
		</defs>
	</svg>
);
