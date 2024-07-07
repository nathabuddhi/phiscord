import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

export default function DeleteMessage({ message, server, channel }) {
    const { toast } = useToast();

    const deleteMessage = async () => {
        const firestore = getFirestore();
        const messageDocRef = doc(firestore, `servers/${server.id}/textchannels/${channel.id}/messages`, message.id);

        try {
            await deleteDoc(messageDocRef);
            toast({
                title: "Success!",
                description: "Message has been deleted.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to delete message: " + error.message,
            });
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-destructive">Delete Message</Button>
            </DialogTrigger>
            <DialogContent>
                <Card>
                    <CardHeader>
                        <CardTitle>Delete Message</CardTitle>
                        <CardDescription>Are you sure you want to delete this message?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="destructive" onClick={deleteMessage}>Delete</Button>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}
