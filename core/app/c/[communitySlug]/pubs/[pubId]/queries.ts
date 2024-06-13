import { pubInclude } from "~/lib/types";
import prisma from "~/prisma/db";

export const getPub = async (pubId: string) => {
    return await prisma.pub.findUnique({
        where: { id: pubId },
        include: {
            ...pubInclude,
        },
    });
};