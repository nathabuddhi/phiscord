import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Hash, Volume1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ServerInfo from "@/components/secondary/server-info";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import EditChannel from "@/components/secondary/edit-channel";
import DeleteChannel from "@/components/secondary/delete-channel";
import CallJoined from "./secondary/call-joined";

export default function ChannelList({ server, selectTextChannel, changeViewType, isInCall, joinCall }) {
    const [textChannels, setTextChannels] = useState([]);
    const [voiceChannels, setVoiceChannels] = useState([]);
    const [textChannelsOpen, setTextChannelsOpen] = useState(true);
    const [voiceChannelsOpen, setVoiceChannelsOpen] = useState(true);
    const [activeChannel, setActiveChannel] = useState(null);
    const user = getAuth().currentUser;


    const isAdminOrOwner = (userId) => {
        if (!server) return false;
        const { ownerId, admins = [] } = server;
        return userId === ownerId || admins.includes(userId);
    };

    const toggleTextChannels = () => {
        setTextChannelsOpen(prevState => !prevState);
    };

    const toggleVoiceChannels = () => {
        setVoiceChannelsOpen(prevState => !prevState);
    };

    const innerSelectTextChannel = (tchannel) => {
        setActiveChannel(tchannel.id);
        selectTextChannel(tchannel);
    };

    useEffect(() => {
        const fetchChannels = () => {
            const firestore = getFirestore();
            const textChannelsCollection = collection(firestore, `servers/${server.id}/textchannels`);
            const voiceChannelsCollection = collection(firestore, `servers/${server.id}/voicechannels`);

            const unsubscribeTextChannels = onSnapshot(textChannelsCollection, (snapshot) => {
                const textChannelsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTextChannels(textChannelsList);
                if (textChannelsList.length > 0) {
                    innerSelectTextChannel(textChannelsList[0]);
                }
            });

            const unsubscribeVoiceChannels = onSnapshot(voiceChannelsCollection, (snapshot) => {
                const voiceChannelsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setVoiceChannels(voiceChannelsList);
            });

            return () => {
                unsubscribeTextChannels();
                unsubscribeVoiceChannels();
            };
        };

        if (server && server.id) {
            setActiveChannel(null);
            fetchChannels();
        }
    }, [server]);

    return (
        <>
            <div>
                <ServerInfo server={server} changeViewType={changeViewType} />
                <ScrollArea className={`${ isInCall ? "h-[calc(100vh-200px)]" : "h-[calc(100vh-100px)]"} w-[200px] bg-darkerbackground px-4 flex flex-col rounded-tr-[5px]`}>
                    <Collapsible className="mb-2" open={textChannelsOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex flex-row justify-normal w-full" onClick={toggleTextChannels}>
                                {textChannelsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <div className="ml-1">Text Channels</div>
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            {textChannels.map((tchannel) => (
                                <HoverCard openDelay={1500} closeDelay={100}>
                                    <HoverCardTrigger>
                                        <Button
                                            key={tchannel.id}
                                            size="sm"
                                            variant="ghost"
                                            className={`text-sm flex flex-row justify-normal ml-4 ${activeChannel === tchannel.id ? "bg-background" : ""}`}
                                            onClick={() => innerSelectTextChannel(tchannel)}
                                        >
                                            <Hash className="mr-1" size={20} /> {tchannel.name}
                                        </Button>
                                    </HoverCardTrigger>
                                    {isAdminOrOwner(user.uid) && <HoverCardContent className="w-auto bg-background">
                                        <EditChannel server={server} channel={tchannel} />
                                        <DeleteChannel server={server} channel={tchannel} type="textchannels" />
                                    </HoverCardContent>}
                                </HoverCard>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                    <Collapsible open={voiceChannelsOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex flex-row justify-normal w-full" onClick={toggleVoiceChannels}>
                                {voiceChannelsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <div className="ml-1">Voice Channels</div>
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            {voiceChannels.map((vchannel) => (
                                <>
                                    <HoverCard openDelay={1500} closeDelay={100}>
                                        <HoverCardTrigger>
                                            <Button
                                                key={vchannel.id}
                                                size="sm"
                                                variant="ghost"
                                                className="text-sm flex flex-row justify-normal ml-4"
                                                onClick={() => joinCall("channel", server, vchannel, null, null)}
                                            >
                                                <Volume1 className="mr-1" size={20} /> {vchannel.name}
                                            </Button>
                                        </HoverCardTrigger>
                                        {isAdminOrOwner(user.uid) && <HoverCardContent className="w-auto bg-background">
                                            <EditChannel server={server} channel={vchannel} />
                                            <DeleteChannel server={server} channel={vchannel} type="voicechannels" />
                                        </HoverCardContent>}
                                    </HoverCard>
                                    {vchannel.joined.map((userid) => (
                                        <CallJoined key={userid} userId={userid} serverId={server.id} />
                                    ))}
                                </>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                </ScrollArea>
            </div>
        </>
    );
}
