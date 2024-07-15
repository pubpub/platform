import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

export const ActiveArchiveTabs = ({
	activeContent,
	archiveContent,
}: {
	activeContent: React.ReactNode;
	archiveContent: React.ReactNode;
}) => {
	return (
		<Tabs defaultValue="active" className="">
			<TabsList className="ml-4 mt-4">
				<TabsTrigger value="active">Active</TabsTrigger>
				<TabsTrigger value="archived">Archived</TabsTrigger>
			</TabsList>
			<div className="px-4">
				<TabsContent value="active">{activeContent}</TabsContent>
				<TabsContent value="archived">{archiveContent}</TabsContent>
			</div>
		</Tabs>
	);
};
