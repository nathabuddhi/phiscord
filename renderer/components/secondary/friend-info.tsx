import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, arrayRemove, updateDoc, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getAuth } from "firebase/auth";

export default function FriendInfo({ friendId, changeUserToChat }) {
    const { toast } = useToast();
    const [friend, setFriend] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const firestore = getFirestore();
        const friendDocRef = doc(firestore, "users", friendId);

        const unsubscribe = onSnapshot(friendDocRef, (friendDoc) => {
            if (friendDoc.exists()) {
                setFriend(friendDoc.data());
            } else {
                setFriend(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [friendId]);

    const unfriendUser = async (userToUnfriendId) => {
        try {
            const firestore = getFirestore();
            const user = getAuth().currentUser;
            const userDocRef = doc(firestore, "users", user.uid);
            const toUnfriendDocRef = doc(firestore, "users", userToUnfriendId);

            await Promise.all([
                updateDoc(userDocRef, {
                    friends: arrayRemove(userToUnfriendId),
                }),
                updateDoc(toUnfriendDocRef, {
                    friends: arrayRemove(user.uid),
                }),
            ])
            toast({
                title: "Success!",
                description: "You have unfriended this user!",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "An error occurred while unfriending this user: " + error.message,
            });
        }
    }

    if (loading) {
        return (
            <div className="flex flex-row m-2 hover:bg-darkerbackground p-1 rounded-[10px]">
                <Skeleton className="h-10 w-10 rounded-full border-[1px] border-serverlistbackground" />
                <div className="ml-2 flex flex-col">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-4 w-12" />
                </div>
            </div>
        );
    }

    if (!friend && !loading) {
        return null
    }
    
    return (
        <div className="flex flex-row justify-between">
            <div className="flex flex-row m-2 hover:bg-darkerbackground p-1 rounded-[10px]">
                <Avatar>
                    <AvatarFallback className="border-[1px] border-serverlistbackground">
                        {friend.avatarname}
                    </AvatarFallback>
                </Avatar>
                <div className="ml-2 flex flex-col">
                    <p className="text-base">{friend.username}</p>
                    <p className="text-xs text-gray-400">{friend.status}</p>
                </div>
            </div>
            <div>
                <Button onClick={() => changeUserToChat(friend.id)} variant="outline" className="mr-2">Send Message</Button>
                <Button size="sm" variant="logout" onClick={() => unfriendUser(friend.id)}>
                    Remove Friend
                </Button>
            </div>
        </div>
    );
}
