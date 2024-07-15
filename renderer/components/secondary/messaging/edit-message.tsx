import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/components/firebase";

const editMessageSchema = z.object({
    message: z.string().min(1, "Message cannot be empty."),
});

export default function EditMessage({ message, server, channel }) {
    const { toast } = useToast();

    const editForm = useForm<z.infer<typeof editMessageSchema>>({
        resolver: zodResolver(editMessageSchema),
        defaultValues: {
            message: message.content,
        },
    });

    async function onEditSubmit(data: z.infer<typeof editMessageSchema>) {
        const messageDocRef = doc(db, `servers/${server.id}/textchannels/${channel.id}/messages`, message.id);

        try {
            await updateDoc(messageDocRef, {
                content: data.message,
                edited: true,
            });
            toast({
                title: "Success!",
                description: "Message has been updated.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to update message: " + error.message,
            });
        }
    }

    return (
        <Dialog>
            <DialogTrigger>
                <Button variant="ghost" className="w-full text-left">Edit Message</Button>
            </DialogTrigger>
            <DialogContent>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Message</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="w-full space-y-3">
                                <div className="space-y-3">
                                    <FormField control={editForm.control} name="message"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Message</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit">Save Message</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}
