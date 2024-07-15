import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { Users, Crown, Shield } from "lucide-react";
import MemberProfile from "@/components/secondary/member-profile";
import { db } from "@/components/firebase";

export default function MemberList({ server, changeUserToChat }) {
    const [owner, setOwner] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [regularMembers, setRegularMembers] = useState([]);

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
            console.error("Error fetching server data: ", error);
        });

        return () => unsubscribe();
    }, [server]);

    return (
        <ScrollArea className="h-full w-[240px] px-4 flex flex-col my-3">
            {owner && (
                <div className="flex flex-col mb-4">
                    <div className="flex flex-row items-center mb-2">
                        <Crown className="mr-2" />
                        <h3 className="font-bold">Owner</h3>
                    </div>
                    <MemberProfile userId={owner.id} key={owner.id} changeUserToChat={changeUserToChat} serverId={server.id} />
                </div>
            )}
            {admins.length > 0 && (
                <div className="flex flex-col mb-4">
                    <div className="flex flex-row items-center mb-2">
                        <Shield className="mr-2" />
                        <h3 className="font-bold">Admins</h3>
                    </div>
                    {admins.map(admin => (
                        <MemberProfile userId={admin.id} key={admin.id} changeUserToChat={changeUserToChat} serverId={server.id} />
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
                        <MemberProfile userId={member.id} key={member.id} changeUserToChat={changeUserToChat} serverId={server.id} />
                    ))}
                </div>
            )}
        </ScrollArea>
    );
}
