"use client";
import { Card, CardContent } from "ui";
import PubRow from "../pubs/PubRow";
import { StagesData } from "./page";

type Props = { stages: NonNullable<StagesData> };

const StageList: React.FC<Props> = function ({ stages }) {
	return (
		<div>
			{stages.map((stage) => {
				return (
					<div key={stage.id} className="mb-20">
						<h3 className="font-bold text-lg mb-2">{stage.name}</h3>
						<Card >
							<CardContent className="pt-4">
								{stage.pubs.map((pub, index, list) => {
									return <>
										<PubRow key={pub.id} pub={pub} />
										{index < list.length -1 && <hr />}
									</>
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
