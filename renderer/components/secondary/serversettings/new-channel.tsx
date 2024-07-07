import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { useToast } from '@/components/ui/use-toast';
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select,SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";

const newchannelSchema = z.object({
    name: z.string().min(1, "Channel name is required.").max(12, "Maximum channel name length is 12 characters."),
    type: z.string().min(1, "Channel type is required.")
})

export default function NewChannel({ server }) {
    const { toast } = useToast();

    const newChannelForm = useForm<z.infer<typeof newchannelSchema>>({
        resolver: zodResolver(newchannelSchema),
        defaultValues: {
            name: "",
            type: "text"
        },
    })

    async function onNewChannelSubmit(data: z.infer<typeof newchannelSchema>) {
        try {
            const firestore = getFirestore();
            const collectionName = data.type === "text" ? "textchannels" : "voicechannels";
            const channelId = `${server.id}_${Date.now()}_${data.type}`;
            const channelRef = doc(firestore, `servers/${server.id}/${collectionName}`, channelId);
            
            if(data.type === "text") {
                await setDoc(channelRef, {
                    id: channelId,
                    name: data.name,
                });
            } else {
                await setDoc(channelRef, {
                    id: channelId,
                    name: data.name,
                    joined: []
                });
            }
            toast({
                title: "Success!",
                description: `${data.type === "text" ? "Text" : "Voice"} channel ${data.type} has been created.`,
            });

            newChannelForm.reset();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed creating channel: " + error.message,
            });
        }
    }

    return (
        <>
            <Dialog>
                <DialogTrigger>
                    <Button variant="ghost" className="my-1 w-full">Create Channel</Button>
                </DialogTrigger>
                <DialogContent>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Channel</CardTitle>
                            <CardDescription>
                                Create a new channel for your server.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Form {...newChannelForm}>
                                <form onSubmit={newChannelForm.handleSubmit(onNewChannelSubmit)} className="w-full space-y-3">
                                    <div className="space-y-3">
                                        <FormField control={newChannelForm.control} name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Channel Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field}  />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                        <FormField
                                        control={newChannelForm.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Channel Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem className="hover:bg-serverlistbackground" value="text">Text</SelectItem>
                                                    <SelectItem className="hover:bg-serverlistbackground" value="voice">Voice</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    </div>
                                    <Button type="submit">Create Channel</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>
        </>
    )
}