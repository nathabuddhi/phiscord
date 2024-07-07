import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { getAuth } from "firebase/auth";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { storage } from "@/components/firebase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
const newServerSchema = z.object({
    serverName: z.string().min(3, "Server names must be at least 3 characters long!"),
    serverIcon: z.any().optional()
});

const joinServerSchema = z.object({
    serverId: z.string().length(42, "Server IDs should be 42 characters long!"),
});


export default function CreateServer({ onServerCreated}) {
    const { toast } = useToast();
    const [formOpen, setFormOpen] = useState(false);

    const joinServerForm = useForm<z.infer<typeof joinServerSchema>>({
        resolver: zodResolver(joinServerSchema),
        defaultValues: {
            serverId: ""
        },
    });
    async function onJoinServerSubmit(data: z.infer<typeof joinServerSchema>) {
        const auth = getAuth();
        const user = auth.currentUser;
        const firestore = getFirestore();

        try {
            const serverRef = doc(firestore, "servers", data.serverId);
            const serverDoc = await getDoc(serverRef);

            if (serverDoc.exists()) {
                const serverData = serverDoc.data();
                if (!serverData.members.includes(user.uid) && !serverData.bans.includes(user.uid)) {
                    await updateDoc(serverRef, {
                        members: arrayUnion(user.uid)
                    });

                    toast({
                        title: "Joined Server",
                        description: `You have successfully joined the server: ${serverData.name}`,
                    });

                    joinServerForm.reset();
                    onServerCreated({ id: data.serverId, ...serverData });
                    setFormOpen(false);
                } else {
                    if(serverData.members.includes(user.uid))
                        toast({
                            variant: "destructive",
                            title: "Uh oh! Something went wrong.",
                            description: "You are already a member of this server.",
                        });
                    else
                        toast({
                            variant: "destructive",
                            title: "Uh oh! Something went wrong.",
                            description: "You are banned from this server.",
                        });
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description: "The server ID you entered does not exist.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "An error occurred while joining the server: " + error.message,
            });
        }
    }

    const newServerForm = useForm<z.infer<typeof newServerSchema>>({
        resolver: zodResolver(newServerSchema),
        defaultValues: {
            serverName: "",
            serverIcon: null
        },
    });
    async function onNewServerSubmit(data: z.infer<typeof newServerSchema>) {
        const auth = getAuth();
        const user = auth.currentUser;
        const firestore = getFirestore();
    
        try {
            let serverIconUrl = "";
            const serverId = `${Date.now()}_${user.uid}`;
            if (data.serverIcon && data.serverIcon.length > 0) {
                const serverIconFile = data.serverIcon[0];
                const storageRef = ref(storage, `server_icons/${serverId}_icon`);
                await uploadBytes(storageRef, serverIconFile);
                serverIconUrl = await getDownloadURL(storageRef);
            }
    
            const serverRef = doc(firestore, "servers", serverId);
            const newServerData = {
                id: serverId,
                name: data.serverName,
                icon: serverIconUrl,
                ownerId: user.uid,
                admins: [],
                bans: [],
                members: [user.uid],
                createdAt: new Date().toISOString()
            };
            await setDoc(serverRef, newServerData);
    
            const textChannelId = `${serverId}_${Date.now()}_text`;
            const textChannelRef = doc(firestore, `servers/${serverId}/textchannels`, textChannelId);
            await setDoc(textChannelRef, {
                id: textChannelId,
                name: "general"
            });
    
            const voiceChannelId = `${serverId}_${Date.now()}_voice`;
            const voiceChannelRef = doc(firestore, `servers/${serverId}/voicechannels`, voiceChannelId);
            await setDoc(voiceChannelRef, {
                id: voiceChannelId,
                name: "general",
                joined: []
            });
    
            toast({
                title: "Success!",
                description: "Your server has been created successfully.",
            });
            
            newServerForm.reset();
            onServerCreated(newServerData);
            setFormOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "An error occurred while creating the server: " + error.message,
            });
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <Button variant="ghost" className="p-[4px] rounded-full" size="icon">
                        <Dialog open={formOpen} onOpenChange={setFormOpen}>
                            <DialogTrigger asChild>
                                <Plus size={24} />
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Settings</DialogTitle>
                                    <DialogDescription>
                                        View and change your settings here.
                                    </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="create" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="create">Create</TabsTrigger>
                                        <TabsTrigger value="join">Join</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="create">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Create Server</CardTitle>
                                                <CardDescription>
                                                    Create a new server for a simple message storage, for you and your friends, or even to build your own community!
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Form {...newServerForm}>
                                                    <form onSubmit={newServerForm.handleSubmit(onNewServerSubmit)} className="w-full space-y-3">
                                                        <div className="space-y-3">
                                                            <FormField control={newServerForm.control} name="serverName"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Server Name</FormLabel>
                                                                        <FormControl>
                                                                            <Input {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField control={newServerForm.control} name="serverIcon"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Server Icon</FormLabel>
                                                                        <FormControl>
                                                                            <Input type="file" onChange={(e) => field.onChange(e.target.files)} className="hover:bg-serverlistbackground hover:cursor-pointer" />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <Button type="submit">Create Server</Button>
                                                    </form>
                                                </Form>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                    <TabsContent value="join">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Join Server</CardTitle>
                                                <CardDescription>
                                                    Join an existing server by entering the server ID.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Form {...joinServerForm}>
                                                    <form onSubmit={joinServerForm.handleSubmit(onJoinServerSubmit)} className="w-full space-y-3">
                                                        <div className="space-y-3">
                                                            <FormField control={joinServerForm.control} name="serverId"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Server Name</FormLabel>
                                                                        <FormControl>
                                                                            <Input {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <Button type="submit">Join Server</Button>
                                                    </form>
                                                </Form>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side='right'>
                    <p>Create a new server</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
