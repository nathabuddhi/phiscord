import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import AddFriend from "@/components/secondary/add-friend";
import { Separator } from "@/components/ui/separator";
import { getFirestore, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function FriendList({ changeViewType, changeUserToChat, isInCall }) {
    const [user, setUser] = useState(null);
    const [userMessages, setUserMessages] = useState([]);

    useEffect(() => {
        const currUser = getAuth().currentUser;
        const firestore = getFirestore();
        const userDocRef = doc(firestore, "users", currUser.uid);

        const unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser(userData);

                if (userData.messages && userData.messages.length > 0) {
                    const messagesWithUserData = await Promise.all(
                        userData.messages.map(async (userId) => {
                            const userRef = doc(firestore, "users", userId);
                            const userSnap = await getDoc(userRef);
                            return userSnap.exists() ? { id: userId, ...userSnap.data() } : null;
                        })
                    );
                    setUserMessages(messagesWithUserData);
                } else {
                    setUserMessages([]);
                }
            }
        });

        return () => unsubscribeUser();
    }, []);

    return (
        <>
            <div>
                <ScrollArea className={`${ isInCall ? "h-[calc(100vh-150px)]" : "h-[calc(100vh-50px)]"} w-[200px] bg-darkerbackground px-4 flex flex-col rounded-tr-[5px] pt-4`}>
                    <Button variant="ghost" className="w-full" onClick={() => changeViewType(2)}>Friends</Button>
                    <AddFriend />
                    <Separator />
                    {userMessages.length > 0 && userMessages.map((messageUser) => (
                        <Button className="w-full justify-normal p-2 m-2" key={messageUser.id} variant="ghost" onClick={async () => {await changeUserToChat(messageUser.id); changeViewType(3);}}>
                            <Avatar className="mr-2">
                                <AvatarFallback>{messageUser.avatarname}</AvatarFallback>
                            </Avatar>
                            {messageUser.username}
                        </Button>
                    ))}
                    {userMessages.length == 0 && <div className="text-gray-500 text-center">No Direct Messages yet</div>}
                </ScrollArea>
            </div>
        </>
    );
}
