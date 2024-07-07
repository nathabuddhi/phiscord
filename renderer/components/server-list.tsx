import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from 'react';
import { Separator } from "@/components/ui/separator";
import CreateServer from "@/components/secondary/create-join-server";
import FriendButton from "@/components/secondary/friend-button";
import { getFirestore, collection, onSnapshot, query, where } from "firebase/firestore";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuth } from "firebase/auth";

export default function ServerList({ selectServer, changeViewType }) {
    const [servers, setServers] = useState([]);
    const [activeServer, setActiveServer] = useState(null);
    const auth = getAuth();
    const user = auth.currentUser;
    let initialRender = true;

    useEffect(() => {
            const firestore = getFirestore();
            const serversCollection = collection(firestore, "servers");
            const serversQuery = query(serversCollection, where("members", "array-contains", user.uid));

            const unsubscribe = onSnapshot(serversQuery, (snapshot) => {
                const serverList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setServers(serverList);
                if (serverList.length > 0 && initialRender) {
                    setActiveServer(serverList[0].id);
                    selectServer(serverList[0]);
                    initialRender = false;
                }
            });

        return () => unsubscribe();
    }, [user]);

    const createServer = (newServer) => {
        setActiveServer(newServer.id);
        selectServer(newServer);
    }

    const innerSelectServer = (server) => {
        changeViewType(1);
        setActiveServer(server.id);
        selectServer(server);
    }

    const changeToFriendView = () => {
        setActiveServer(null);
    }

    return (
        <ScrollArea className="h-[calc(100vh-50px)] w-[80px] bg-serverlistbackground">
            <div className="p-4 flex flex-col items-center">
                <FriendButton changeViewType={changeViewType} changeToFriendView={changeToFriendView} />
                <CreateServer onServerCreated={createServer} />
                <Separator className="mb-[6px] mt-[3px]" />
                {servers.map((server) => (
                    <React.Fragment key={server.id}>
                        <HoverCard openDelay={300} closeDelay={0}>
                            <HoverCardTrigger>
                                <div className="relative">
                                    {activeServer === server.id && (
                                        <div className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full"></div>
                                    )}
                                    <Avatar
                                        onClick={() => innerSelectServer(server)}
                                        className={`m-1 bg-accent hover:rounded-[10px] transition-all duration-300 hover:cursor-pointer ${activeServer === server.id ? 'rounded-[10px]' : 'rounded-full'}`}
                                    >
                                        <AvatarImage src={server.icon} className="w-[40px] h-[40px]" />
                                        <AvatarFallback>{server.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-auto max-w-80">
                                Server Name: {server.name}
                            </HoverCardContent>
                        </HoverCard>
                    </React.Fragment>
                ))}
            </div>
        </ScrollArea>
    );
}
