import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, arrayRemove, updateDoc, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getAuth } from "firebase/auth";

export default function BlockInfo( { blockedId }) {
    const { toast } = useToast();
    const [blockedUser, setBlockedUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const firestore = getFirestore();
        const blockedDocRef = doc(firestore, "users", blockedId);

        const unsubscribe = onSnapshot(blockedDocRef, (blockedDoc) => {
            if (blockedDoc.exists()) {
                setBlockedUser(blockedDoc.data());
            } else {
                setBlockedUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [blockedId]);

    const unblockUser = async (userToUnblockId) => {
        try {
            const firestore = getFirestore();
            const user = getAuth().currentUser;
            const userDocRef = doc(firestore, "users", user.uid);

            await updateDoc(userDocRef, {
                blocked: arrayRemove(userToUnblockId),
            });

            toast({
                title: "Success!",
                description: "You have unblocked this user!",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "An error occurred while unblocking this user: " + error.message,
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

    if (!blockedUser && !loading) {
        return null
    }
    
    return (
        <div className="flex flex-row justify-between">
            <div className="flex flex-row m-2 hover:bg-darkerbackground p-1 rounded-[10px]">
                <Avatar>
                    <AvatarFallback className="border-[1px] border-serverlistbackground">
                        {blockedUser.avatarname}
                    </AvatarFallback>
                </Avatar>
                <div className="ml-2 flex flex-col">
                    <p className="text-base">{blockedUser.username}</p>
                    <p className="text-xs text-gray-400">{blockedUser.status}</p>
                </div>
            </div>
            <div>
                <Button size="sm" variant="logout" onClick={() => unblockUser(blockedUser.id)}>
                    Unblock
                </Button>
            </div>
        </div>
    );
}