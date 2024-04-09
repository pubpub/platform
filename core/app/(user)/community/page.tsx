import React from 'react';
import  {AddCommunity } from './AddCommunity';

export  default async function Page() {
    return (
        <div className="mb-16 flex items-center justify-between">
        <h1 className="text-xl font-bold">Communities</h1>
        <AddCommunity/>
    </div>
    );
}