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

const editChannelSchema = z.object({
    name: z.string().min(1, "Channel name cannot be empty."),
});

export default function EditChannel({ server, channel }) {
    const { toast } = useToast();

    const editForm = useForm<z.infer<typeof editChannelSchema>>({
        resolver: zodResolver(editChannelSchema),
        defaultValues: {
            name: channel.name,
        },
    });

    async function onEditSubmit(data: z.infer<typeof editChannelSchema>) {
        const channelDocRef = doc(db, `servers/${server.id}/textchannels/${channel.id}`);

        try {
            await updateDoc(channelDocRef, {
                name: data.name,
            });
            toast({
                title: "Success!",
                description: "Channel name has been updated.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to update channel: " + error.message,
            });
        }
    }

    return (
        <Dialog>
            <DialogTrigger>
                <Button variant="ghost" className="w-full text-left">Edit Channel</Button>
            </DialogTrigger>
            <DialogContent>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Channel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="w-full space-y-3">
                                <div className="space-y-3">
                                    <FormField control={editForm.control} name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Channel name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit">Save Changes</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}
