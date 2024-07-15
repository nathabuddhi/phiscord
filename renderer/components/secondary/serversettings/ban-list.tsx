import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { DatabaseBackup, ShieldBan, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { arrayRemove, updateDoc } from "firebase/firestore";
import { db } from "@/components/firebase";

export default function BanList({ server }) {
    const { toast } = useToast();
    const [bannedUsers, setBannedUsers] = useState([]);

    const unbanMember = async (memberId) => {
        try {
            const serverDocRef = doc(db, "servers", server.id);

            await updateDoc(serverDocRef, {
                bans: arrayRemove(memberId),
            });

            toast({
                title: "Success!",
                description: "You have unbanned the member.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "An error occurred while unbanning the member: " + error.message,
            });
        }
    }

    useEffect(() => {
        const serverDocRef = doc(db, "servers", server.id);
    
        const unsubscribe = onSnapshot(serverDocRef, async (serverDoc) => {
            if (serverDoc.exists()) {
                const serverData = serverDoc.data();
                const { bans: bannedMemberIds = [] } = serverData;
    
                const bannedMembersData = await Promise.all(bannedMemberIds.map(async memberId => {
                    const memberDocRef = doc(db, "users", memberId);
                    const memberDoc = await getDoc(memberDocRef);
                    return { id: memberId, ...memberDoc.data() };
                }));
    
                setBannedUsers(bannedMembersData);
            }
        }, (error) => {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "An error occurred while fetching banned members: " + error.message,
            })
        });
    
        return () => unsubscribe();
    }, [server]);
     
    if(bannedUsers.length <= 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full">
                <ShieldCheck size={50} />
                <p className="text-xl">No banned users</p>
            </div>
        )
    }   

    return (
        <>
            <ScrollArea className="h-full w-full px-4 flex flex-col my-3">
                {bannedUsers.length > 0 && (
                    <div className="flex flex-col mb-4">
                        <div className="flex flex-row items-center mb-2">
                            <ShieldBan className="mr-2" />
                            <h3 className="font-bold">Banned</h3>
                        </div>
                        {bannedUsers.map(admin => (
                            <div className="flex flex-row items-center hover:bg-darkerbackground p-1 rounded-[5px] justify-between">
                                <div className="flex flex-row items-center">
                                    <Avatar className="mr-2">
                                        <AvatarFallback className='border border-serverlistbackground text-xl'>{admin.avatarname}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-foreground">{admin.username}</p>
                                    </div>
                                </div>
                                <div className="flex flex-row items-center">
                                    <Button variant="destructive" className="ml-2" size="sm" onClick={() => unbanMember(admin.id)}>Unban</Button>
                                </div>    
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </>
    )
}