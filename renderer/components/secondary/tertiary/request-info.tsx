import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/components/ui/use-toast';
import { auth, db } from '@/components/firebase';

export default function RequestInfo({ request, type }) {
    const [friendInfo, setFriendInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const user = auth.currentUser;

    const acceptFriendRequest = async () => {
        try {
            const senderDocRef = doc(db, "users", request.senderId);
            const receiverDocRef = doc(db, "users", request.receiverId);
            const requestDocRef = doc(db, "friendrequests", request.id);

            await Promise.all([
                updateDoc(senderDocRef, {
                    friends: arrayUnion(request.receiverId)
                }),
                updateDoc(receiverDocRef, {
                    friends: arrayUnion(request.senderId)
                }),
                deleteDoc(requestDocRef)
            ]);

            toast({
                title: "Friend Request Accepted",
                description: `You are now friends with ${friendInfo.username}.`,
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to accept friend request: " + error.message,
            });
        }
    };

    const declineFriendRequest = async () => {
        try {
            const requestDocRef = doc(db, "friendrequests", request.id);

            await updateDoc(requestDocRef, {
                status: 'declined'
            });

            toast({
                title: "Friend Request Declined",
                description: `You have declined the friend request from ${friendInfo.username}.`,
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to decline friend request: " + error.message,
            });
        }
    };

    const cancelFriendRequest = async () => {
        try {
            const requestDocRef = doc(db, "friendrequests", request.id);

            await deleteDoc(requestDocRef);
            toast({
                title: "Friend Request Cancelled",
                description: `You have cancelled the friend request to ${friendInfo.username}.`,
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to cancel friend request: " + error.message,
            });
        }
    };

    const blockUser = async () => {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const requestDocRef = doc(db, "friendrequests", request.id);

            await Promise.all([
                updateDoc(requestDocRef, {
                    status: 'declined'
                }),
                updateDoc(userDocRef, {
                    blocked: arrayUnion(request.senderId)
                })
            ])

            toast({
                title: "Success!",
                description: `You have blocked ${friendInfo.username} successfully.`,
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to block user: " + error.message,
            });
        }
    }

    useEffect(() => {
        const fetchFriendInfo = async () => {
            const friendId = type === "incoming" ? request.senderId : request.receiverId;
            const friendDocRef = doc(db, "users", friendId);
            const friendDoc = await getDoc(friendDocRef);
            if (friendDoc.exists()) {
                setFriendInfo(friendDoc.data());
                setLoading(false);
            } else {
                setLoading(false);
                setFriendInfo(null);
            }
        };

        fetchFriendInfo();
    }, [request, type, db]);

    if (loading) {
        return (
            <div className="flex flex-row m-2 hover:bg-darkerbackground p-1 rounded-[10px]">
                <Skeleton className="h-10 w-10 rounded-full border-[1px] border-serverlistbackground" />
                <div className="ml-2 flex flex-col">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
        );
    }

    if (!loading && !friendInfo) {
        return null;
    }

    if(request.status === "declined" && user.uid === request.receiverId)
        return null;

    return (
        <div className="flex flex-row m-2 hover:bg-serverlistbackground p-2 rounded-[10px] justify-between border-[1px] border-serverlistbackground">
            <div className="flex flex-row items-center">
                <Avatar>
                    <AvatarFallback className="border-[1px] border-serverlistbackground">
                        {friendInfo.avatarname}
                    </AvatarFallback>
                </Avatar>
                <div className="ml-2 flex flex-col">
                    <p className="text-base">{friendInfo.username}</p>
                    <p className="text-xs text-gray-400">{friendInfo.status}</p>
                </div>
            </div>
            <div>
                {type === "incoming" && (
                    <>
                        <Button size="sm" onClick={acceptFriendRequest}>Accept</Button>
                        <Button variant="logout" size="sm" className="mx-2" onClick={declineFriendRequest}>Decline</Button>
                        <Button variant="destructive" size="sm" onClick={blockUser}>Block</Button>
                    </>
                )}
                {type === "outgoing" && (
                    <Button variant="destructive" size="sm" onClick={cancelFriendRequest}>Cancel</Button>
                )}
            </div>
        </div>
    )
}
