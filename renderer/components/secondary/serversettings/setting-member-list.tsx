import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from 'react';
import { Users, Crown, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { arrayRemove, arrayUnion, updateDoc, doc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db } from "@/components/firebase";

export default function SettingMemberList({ server }) {
    const [owner, setOwner] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [regularMembers, setRegularMembers] = useState([]);
    const currUser = auth.currentUser;
    const { toast } = useToast();

    const banMember = async (memberId) => {
        try {
            const serverDocRef = doc(db, "servers", server.id);

            await updateDoc(serverDocRef, {
                members: arrayRemove(memberId),
                bans: arrayUnion(memberId),
            });

            toast({
                title: "Success!",
                description: "You have banned the member.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "An error occurred while banning the member: " + error.message,
            });
        }
    }

    const kickMember = async (memberId) => {
        try {
            const serverDocRef = doc(db, "servers", server.id);

            await updateDoc(serverDocRef, {
                members: arrayRemove(memberId),
            });

            toast({
                title: "Success!",
                description: "You have kicked the member.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "An error occurred while kicking the member: " + error.message,
            });
        }
    }

    const promoteMember = async (memberId) => {
        try {
            const serverDocRef = doc(db, "servers", server.id);

            await updateDoc(serverDocRef, {
                admins: arrayUnion(memberId),
            });

            toast({
                title: "Success!",
                description: "You have promoted the member to admin!",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "An error occurred while promoting the member: " + error.message,
            });
        }
    }

    const demoteMember = async (memberId) => {
        try {
            const serverDocRef = doc(db, "servers", server.id);

            await updateDoc(serverDocRef, {
                admins: arrayRemove(memberId),
            });

            toast({
                title: "Success!",
                description: "You have demoted the member from admin to member!",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "An error occurred while demoting the member: " + error.message,
            });
        }
    }

    useEffect(() => {
        const serverDocRef = doc(db, "servers", server.id);

        const unsubscribe = onSnapshot(serverDocRef, async (serverDoc) => {
            if (serverDoc.exists()) {
                const serverData = serverDoc.data();
                const { ownerId, admins: adminIds = [], members: memberIds = [] } = serverData;

                const membersData = await Promise.all(memberIds.map(async memberId => {
                    const memberDocRef = doc(db, "users", memberId);
                    const memberDoc = await getDoc(memberDocRef);
                    return { id: memberId, ...memberDoc.data() };
                }));

                const ownerData = membersData.find(member => member.id === ownerId);
                const adminsData = membersData.filter(member => adminIds.includes(member.id));
                const regularMembersData = membersData.filter(member => !adminIds.includes(member.id) && member.id !== ownerId);

                setOwner(ownerData);
                setAdmins(adminsData);
                setRegularMembers(regularMembersData);
            }
        }, (error) => {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to fetch server members: " + error.message,
            })
        });

        return () => unsubscribe();
    }, [server]);

    return (
        <ScrollArea className="h-full w-full px-4 flex flex-col my-3">
            {owner && (
                <div className="flex flex-col mb-4">
                    <div className="flex flex-row items-center mb-2">
                        <Crown className="mr-2" />
                        <h3 className="font-bold">Owner</h3>
                    </div>
                    <div className="flex flex-row items-center hover:bg-darkerbackground p-1 rounded-[5px]">
                        <Avatar className="mr-2">
                            <AvatarFallback className='border border-serverlistbackground text-xl'>{owner.avatarname}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className="text-lg font-semibold text-foreground">{owner.username}</p>
                        </div>
                    </div>
                </div>
            )}
            {admins.length > 0 && (
                <div className="flex flex-col mb-4">
                    <div className="flex flex-row items-center mb-2">
                        <Shield className="mr-2" />
                        <h3 className="font-bold">Admins</h3>
                    </div>
                    {admins.map(admin => (
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
                                {currUser.uid === owner.id && <>
                                    <Button className="ml-2" size="sm" onClick={() => demoteMember(admin.id)}>Demote</Button>
                                    <Button variant="logout" className="mx-2" size="sm" onClick={() => kickMember(admin.id)}>Kick</Button>
                                    <Button variant="destructive" size="sm" onClick={() => banMember(admin.id)}>Ban</Button>
                                </>}
                            </div>    
                        </div>
                    ))}
                </div>
            )}
            {regularMembers.length > 0 && (
                <div className="flex flex-col">
                    <div className="flex flex-row items-center mb-2">
                        <Users className="mr-2" />
                        <h3 className="font-bold">Members</h3>
                    </div>
                    {regularMembers.map(member => (
                        <div className="flex flex-row items-center hover:bg-darkerbackground p-1 rounded-[5px] justify-between">
                            <div className="flex flex-row items-center">
                                <Avatar className="mr-2">
                                    <AvatarFallback className='border border-serverlistbackground text-xl'>{member.avatarname}</AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <p className="text-lg font-semibold text-foreground">{member.username}</p>
                                </div>
                            </div>
                            <div className="flex flex-row items-center">
                                {currUser.uid === owner.id && <Button className="ml-2" size="sm" onClick={() => promoteMember(member.id)}>Promote</Button>}
                                <Button variant="logout" className="mx-2" size="sm" onClick={() => kickMember(member.id)}>Kick</Button>
                                {currUser.uid === owner.id && <Button variant="destructive" size="sm" onClick={() => banMember(member.id)}>Ban</Button>}
                            </div>    
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
    );
}
