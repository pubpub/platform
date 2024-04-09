"use client"
import React, { useState } from 'react';
import { Button } from 'ui/button';
import {ListPlus} from 'ui/icon';

export const AddCommunity = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const createCommunity =  (data: { name: string, description: string }) => {
        // eslint-disable-next-line no-console
        console.log(data)
    }
    const handleCreateCommunity = async (e: React.FormEvent) => {
        e.preventDefault();
        createCommunity({ name, description });
    };

    return (
        <Button>
            <ListPlus/>Create Community
        </Button>
    );
};
