import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

export const ActiveArchiveTabs = ({
	activeContent,
	archiveContent,
	className,
}: {
	activeContent: React.ReactNode;
	archiveContent: React.ReactNode;
	className?: string;
}) => {
	return (
		<Tabs defaultValue="active" className={className}>
			<TabsList>
				<TabsTrigger value="active">Active</TabsTrigger>
				<TabsTrigger value="archived">Archived</TabsTrigger>
			</TabsList>
			<div>
				<TabsContent value="active">{activeContent}</TabsContent>
				<TabsContent value="archived">{archiveContent}</TabsContent>
			</div>
		</Tabs>
	);
};
