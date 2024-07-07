import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { getFirestore, doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const addFriendSchema = z.object({
    friendId: z.string().length(28, "Invalid User ID! User ID's must be 28 characters long!"),
});

export default function AddFriend() {
    const { toast } = useToast();
    const user = getAuth().currentUser;
    const [dialogOpen, setDialogOpen] = useState(false);

    const addFriendForm = useForm<z.infer<typeof addFriendSchema>>({
        resolver: zodResolver(addFriendSchema),
        defaultValues: {
            friendId: ""
        },
    });

    async function checkForExistingFriendRequest(senderId, receiverId) {
        const firestore = getFirestore();
        const friendRequestsRef = collection(firestore, "friendrequests");
        const q = query(friendRequestsRef, where("senderId", "==", senderId), where("receiverId", "==", receiverId));
        const q2 = query(friendRequestsRef, where("senderId", "==", receiverId), where("receiverId", "==", senderId));
        const querySnapshot = await getDocs(q);
        const querySnapshot2 = await getDocs(q2);
        
        if(querySnapshot.empty && querySnapshot2.empty)
            return false;
        return true;
    }

    const copyUserId = () => {
        navigator.clipboard.writeText("Let's be friends on PHiscord! Here's my user ID: " + user.uid)
        toast({
            title: "User ID Copied!",
            description: "Your user ID has been copied to your clipboard. Share it with your friends to add you!",
        });
        setDialogOpen(false);
    }

    async function onAddFriendSubmit(data: z.infer<typeof addFriendSchema>) {
        try {
            const firestore = getFirestore();
            const userId = user.uid;
            const userToAddId = data.friendId;

            const userDocRef = doc(firestore, "users", userId);
            const userToAddDocRef = doc(firestore, "users", userToAddId);

            const [userDoc, userToAddDoc] = await Promise.all([
                getDoc(userDocRef),
                getDoc(userToAddDocRef)
            ]);

            if (userDoc.exists() && userToAddDoc.exists()) {
                const userData = userDoc.data();
                const userToAddData = userToAddDoc.data();

                if (!userToAddData.randomFriend) {
                    toast({
                        variant: "destructive",
                        title: "Friend Request Auto-Rejected",
                        description: "The user you want to add isn't accepting friend requests.",
                    });
                } else if (userData.friends.includes(userToAddId)) {
                    toast({
                        variant: "destructive",
                        title: "Friend Request Failed",
                        description: "You're already friends with this user.",
                    });
                } else if(userToAddData.blocked.includes(userData.id)) {
                    toast({
                        variant: "destructive",
                        title: "Friend Request Failed",
                        description: "You have been blocked by this user.",
                    })
                } else if(userData.blocked.includes(userToAddData.id)) {
                    toast({
                        variant: "destructive",
                        title: "Friend Request Failed",
                        description: "You have this user blocked. Unblock them first if you want to add them as a friend.",
                    })
                } else if (await checkForExistingFriendRequest(userId, userToAddId)) {
                    toast({
                        variant: "destructive",
                        title: "Friend Request Failed",
                        description: "You already have a pending friend request with this user.",
                    });
                } else {
                    const friendRequestsRef = collection(firestore, "friendrequests");
                    await addDoc(friendRequestsRef, {
                        senderId: userId,
                        receiverId: userToAddId,
                        timestamp: serverTimestamp(),
                        status: "pending"
                    });
                    toast({
                        
                        title: "Success!",
                        description: "Friend request sent.",
                    });
                    
                }
            } else if (!userToAddDoc.exists()) {
                toast({
                    variant: "destructive",
                    title: "Uh oh. Something went wrong.",
                    description: "The user ID you submitted seems to not exist. Please try again.",
                });
            }
            addFriendForm.reset();
            setDialogOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to add friend: " + error.message,
            });
        }
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild onClick={() => setDialogOpen(true)}>
                <Button variant="ghost" className="w-full my-2">Add Friend</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Add Friend</CardTitle>
                        <CardDescription>
                            Send a friend request to someone you know!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Form {...addFriendForm}>
                            <form onSubmit={addFriendForm.handleSubmit(onAddFriendSubmit)} className="w-full space-y-3">
                                <div className="space-y-3">
                                    <FormField control={addFriendForm.control} name="friendId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>User ID</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit">Send Friend Request</Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" onClick={() => {copyUserId()}}>Copy my ID</Button>
                    </CardFooter>
                </Card>
            </DialogContent>
        </Dialog>
    )
}
