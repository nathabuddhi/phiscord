import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/components/ui/use-toast';
import { getFirestore, doc, getDoc, addDoc, collection, onSnapshot, where, getDocs, serverTimestamp, query } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function MemberProfile({ userId, changeUserToChat, serverId }) {
    const [user, setUser] = useState(null);
    const { toast } = useToast();
    const [nickname, setNickname] = useState('');

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

    async function sendFriendRequest() {
        try {
            const firestore = getFirestore();
            const currUser = getAuth().currentUser;
            const currUserId = currUser.uid;
            const userToAddId = userId;

            if(currUserId === userToAddId) {
                toast({
                    variant: "easter",
                    title: "Woah! Slow down there!",
                    description: "You just tried to add yourself as a friend.. are you.. ok?",
                })
                return;
            }

            const userDocRef = doc(firestore, "users", currUserId);
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
                } else if (userToAddData.blocked.includes(userData.id)) {
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
                } else if (await checkForExistingFriendRequest(currUserId, userToAddId)) {
                    toast({
                        variant: "destructive",
                        title: "Friend Request Failed",
                        description: "You already have a pending friend request with this user.",
                    });
                } else {
                    const friendRequestsRef = collection(firestore, "friendrequests");
                    await addDoc(friendRequestsRef, {
                        senderId: currUserId,
                        receiverId: userToAddId,
                        timestamp: serverTimestamp(),
                        status: "pending"
                    });
                    const notifQuery = collection(firestore, `users/${userToAddId}/notifications`);
                    await addDoc(notifQuery, {
                        content: "Sent you a friend request.",
                        from: currUserId,
                    });
                    toast({
                        title: "Success!",
                        description: "Friend request sent.",
                    });
                    
                }
            } 
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to add friend: " + error.message,
            });
        }
    }

    useEffect(() => {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, "users", userId);
        const nicknameDocRef = doc(firestore, `servers/${serverId}/nicknames`, userId);

        const unsubcribeNickname = onSnapshot(nicknameDocRef, (nicknameDoc) => {
            if (nicknameDoc.exists()) {
                setNickname(nicknameDoc.data().nickname);
            } else {
                setNickname('');
            }
        });

        const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                setUser(userDoc.data());
            } else {
                setUser(null);
            }
        }, (error) => {
            setUser(null);
        });

        return () => {
            unsubscribeUser();
            unsubcribeNickname();
        };
    }, [userId]);

    if (!user) {
        return (
            <div className="flex items-center space-x-4 mt-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    return (
        <Popover>
            <PopoverTrigger className='w-full'>
                <Button variant="ghost" className='justify-normal m-2 w-full h-[50px] p-0 py-6 px-1 mb-2'>
                    <Avatar className="mr-2">
                        <AvatarFallback className='border border-serverlistbackground'>{user.avatarname}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                        <p className="text-base font-semibold text-foreground">{nickname === '' ? user.displayname : nickname}</p>
                        <p className="text-xs text-gray-400">{user.status}</p>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent side='left' className='min-w-40 w-auto'>
                <Avatar className="mr-2 mb-4 w-16 h-16">
                    <AvatarFallback className='border border-serverlistbackground text-xl'>{user.avatarname}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                    <p className="text-xl font-semibold text-foreground">{nickname === '' ? user.displayname : nickname}</p>
                    <p className="text-base font-semibold text-foreground">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.status}</p>
                </div>
                {
                    userId != getAuth().currentUser.uid &&
                    <div className='flex flex-col'>
                        <Button onClick={sendFriendRequest} variant='outline' className='my-2'>Send Friend Request</Button>
                        <Button onClick={() => changeUserToChat(userId)} variant='outline'>Send Message</Button>
                    </div>
                }
            </PopoverContent>
        </Popover>
    );
}
