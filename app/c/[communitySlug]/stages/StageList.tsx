"use client";
import { Card, CardContent } from "@/components/Card";
import PubRow from "../pubs/PubRow";
import { StagesData } from "./page";

type Props = { stages: NonNullable<StagesData> };

const StageList: React.FC<Props> = function ({ stages }) {
	return (
		<div>
			{stages.map((stage) => {
				return (
					<div key={stage.id} className="mb-20">
						<h3>{stage.name}</h3>
						<Card>
							<CardContent>
								{stage.pubs.map((pub) => {
									return <PubRow key={pub.id} pub={pub} />;
								})}
							</CardContent>
						</Card>
					</div>
				);
			})}
		</div>
	);
};
export default StageList;
