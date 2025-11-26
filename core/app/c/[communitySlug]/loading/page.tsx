import { Skeleton } from "ui/skeleton";
import { SkeletonButton } from "~/app/components/skeletons/SkeletonButton";
import { ContentLayout } from "../ContentLayout";
import { Spinner} from 'ui/spinner'

export default function Loading(){
return <ContentLayout
title={
    <>

    <Skeleton className="w-8 h-8 rounded-full mr-2" />
    <Skeleton className="w-48 md:w-96 h-8" />
    </>
}
right={
    <SkeletonButton className="w-24"/>
}
className="overflow-hidden grid place-items-center"
>
    <Spinner/>
</ContentLayout>
}