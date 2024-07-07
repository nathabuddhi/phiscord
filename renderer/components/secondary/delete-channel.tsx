import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

export default function DeleteChannel({ server, channel, type }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const deleteChannel = async () => {
        const firestore = getFirestore();
        const channelDocRef = doc(firestore, `servers/${server.id}/${type}/${channel.id}`);

        try {
            await deleteDoc(channelDocRef);
            toast({
                title: "Success!",
                description: "Channel has been deleted.",
            });
            setIsOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to delete channel: " + error.message,
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-destructive">Delete Channel</Button>
            </DialogTrigger>
            <DialogContent>
                <Card>
                    <CardHeader>
                        <CardTitle>Delete Channel</CardTitle>
                        <CardDescription>Are you sure you want to delete this channel?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="destructive" onClick={deleteChannel}>Delete</Button>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}
