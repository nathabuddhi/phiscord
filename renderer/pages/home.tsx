import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import ServerList from '@/components/server-list';
import ChannelList from '@/components/channel-list';
import UserBar from '@/components/user-bar';
import userMiddleware from '@/components/middleware/user-middleware';
import ChatBox from '@/components/chat-box';
import MemberList from '@/components/member-list';
import FriendBox from '@/components/friend-box';
import FriendList from '@/components/friend-list';
import FriendChatBox from '@/components/friend-chat-box';
import CallInfo from '@/components/call-info';
import CallBox from '@/components/call-box';
import { getAuth } from 'firebase/auth';
import { getDoc, doc, getFirestore, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';
import FriendCallBox from '@/components/friend-call-box';

const HomePage = ({ userDetails }) => {
    const [isViewingServer, setIsViewingServer] = useState(false);
    const [isViewingChat, setIsViewingChat] = useState(false);
    const [server, setServer] = useState(null);
    const [channel, setChannel] = useState(null);
    const [chatId, setChatId] = useState();
    const [isInCall, setIsInCall] = useState(false);
    const [isViewingCall, setIsViewingCall] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isDeafened, setIsDeafened] = useState(false);
    const [serverCall, setServerCall] = useState(null);
    const [channelCall, setChannelCall] = useState(null);
    const [callType, setCallType] = useState();
    const [userToCall, setUserToCall] = useState(null);
    const [remoteTracks, setRemoteTracks] = useState([]);
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);

    const clientRef = useRef(null);
    const APP_ID = "0403f6945a0d406c9efa7cb00f5c7aca";

    const selectTextChannel = (selectedChannel) => {
        setChannel(selectedChannel);
    };

    const selectServer = (selectedServer) => {
        setServer(selectedServer);
        serverView();
    };

    const friendListView = () => {
        setIsViewingServer(false);
        setIsViewingChat(false);
    };

    const friendChatView = () => {
        setIsViewingServer(false);
        setIsViewingChat(true);
    };

    const changeUserToChat = async (userToChatId) => {
        const firestore = getFirestore();
        const tempUser = getAuth().currentUser;
        const userDocRef = doc(firestore, "users", tempUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();

            if (!userData.messages.includes(userToChatId)) {
                await updateDoc(userDocRef, {
                    messages: arrayUnion(userToChatId),
                });
            }
        }

        friendChatView();
        setChatId(userToChatId);
    };

    const serverView = () => {
        setIsViewingServer(true);
        setIsViewingChat(true);
    };

    const changeViewType = (num) => {
        if (num === 1) {
            serverView();
        } else if (num === 2) {
            friendListView();
        } else if (num === 3) {
            friendChatView();
        }
    };

    const toggleVideo = async () => {
        if (localVideoTrack) {
            if (isVideoOn) {
                localVideoTrack.stop();
                localVideoTrack.setEnabled(false);
            } else {
                localVideoTrack.setEnabled(true);
                localVideoTrack.play(`local-${userDetails.id}`);
            }
            setIsVideoOn((prevState) => !prevState);
        }
    };

    const toggleMic = async() => {
        if (localAudioTrack) {
            localAudioTrack.setEnabled(!isMicOn);
        }
        if(isDeafened && !isMicOn) {
            toggleDeafened();
        }
        setIsMicOn((prevState) => !prevState);
    };

    const toggleDeafened = () => {
        if (clientRef.current) {
            clientRef.current.remoteUsers.forEach(user => {
                if (isDeafened) {
                    user.audioTrack?.setVolume(100);
                } else {
                    user.audioTrack?.setVolume(0);
                }
            });
        }
        if(isMicOn && !isDeafened) {
            toggleMic();
        }
        setIsDeafened((prevState) => !prevState);
    };

    const toggleViewCall = () => {
        setIsViewingCall((prevState) => !prevState);
    };

    const addJoinedMember = async (serverId, channelId, userId) => {
        const firestore = getFirestore();
        const channelDocRef = doc(firestore, `servers/${serverId}/voicechannels`, channelId);

        await updateDoc(channelDocRef, {
            joined: arrayUnion(userId),
        });
    }

    const removeJoinedMember = async (serverId, channelId, userId) => {
        const firestore = getFirestore();
        const channelDocRef = doc(firestore, `servers/${serverId}/voicechannels`, channelId);

        await updateDoc(channelDocRef, {
            joined: arrayRemove(userId),
        })
    }

    const joinCall = async (type, server, channel, userToCall, directMessageID) => {
        if(isInCall) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "You are already in a call. Please leave the current call to join another.",
            })
            return;
        }

        setCallType(type);
        if (type === "channel") {
            setServerCall(server);
            setChannelCall(channel);
            setUserToCall(null);
        } else if (type === "user") {
            setServerCall(null);
            setChannelCall(null);
            setUserToCall(userToCall);
        } else {
            setIsViewingCall(false);
            setIsInCall(false);
            setIsVideoOn(false);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "An error occurred while trying to join the call. Please try again later.",
            });
            return;
        }

        if (typeof window !== "undefined") {
            try {
                const AgoraRTC = await import("agora-rtc-sdk-ng").then((mod) => mod.default);
                const agoraClient = AgoraRTC.createClient({
                    mode: "rtc",
                    codec: "vp8"
                });

                clientRef.current = agoraClient;
                if(callType === 'channel') {
                    await agoraClient.join(APP_ID, channel.id, null, userDetails.id);
                } else {
                    await agoraClient.join(APP_ID, directMessageID, null, userDetails.id);
                }

                setIsVideoOn(true);
                setIsMicOn(true);
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                const videoTrack = await AgoraRTC.createCameraVideoTrack();
                setLocalAudioTrack(audioTrack);
                setLocalVideoTrack(videoTrack);
                await agoraClient.publish([audioTrack, videoTrack]);
                setRemoteTracks((prevUsers) => [...prevUsers, { id: userDetails.id, audioTrack, videoTrack }]);

                agoraClient.on("user-published", handleUserPublished);
                agoraClient.on("user-unpublished", handleUserUnpublished);
                agoraClient.on("user-left", handleUserLeft);

                setIsInCall(true);
                setIsViewingCall(true);
                if(type === 'channel')
                    addJoinedMember(server.id, channel.id, userDetails.id);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description: "An error occurred while trying to join the call: " + error.message,
                });
                leaveCall();
            }
        }
    };

    const handleUserPublished = async (user, mediaType) => {
        const client = clientRef.current;
        if (client) {
            await client.subscribe(user, mediaType);

            if (mediaType === "video") {
                const videoTrack = user.videoTrack;
                setRemoteTracks((prevUsers) => [...prevUsers, { id: user.uid, videoTrack }]);
            }

            if (mediaType === "audio") {
                user.audioTrack.play();
            }
        }
    };

    const handleUserUnpublished = (user, mediaType) => {
        if (mediaType === "video") {
            setRemoteTracks((prevUsers) => prevUsers.filter((u) => u.id !== user.uid));
        }

        if (mediaType === "audio") {
            user.audioTrack.stop();
        }
    };

    const handleUserLeft = (user) => {
        setRemoteTracks((prevUsers) => prevUsers.filter((u) => u.id !== user.uid));
    };

    const leaveCall = () => {
        setIsViewingCall(false);
        setIsInCall(false);
        setIsVideoOn(false);
        setUserToCall(null);

        if(serverCall && channelCall) {
            removeJoinedMember(serverCall.id, channelCall.id, userDetails.id);
            setServerCall(null);
            setChannelCall(null);
        }

        if (localAudioTrack)
            localAudioTrack.close();
        if (localVideoTrack)
            localVideoTrack.close();
        const client = clientRef.current;
        if (client)
            client.leave();

        setRemoteTracks([]);
    };

    return (
        <>
            <Head>
                <title>{isViewingServer ? (server ? server.name : "Server") : "Friends"} - PHiscord</title>
            </Head>
            <div className="flex flex-row">
                <div>
                    <div className="flex flex-row">
                        <ServerList selectServer={selectServer} changeViewType={changeViewType} />
                        <div className="flex flex-col">
                            {isViewingServer ? (
                                <ChannelList server={server} selectTextChannel={selectTextChannel} changeViewType={changeViewType} isInCall={isInCall} joinCall={joinCall} />
                            ) : (
                                <FriendList changeViewType={changeViewType} changeUserToChat={changeUserToChat} isInCall={isInCall} />
                            )}
                            {isInCall && (
                                <CallInfo
                                    isVideoOn={isVideoOn}
                                    toggleVideo={toggleVideo}
                                    isViewingCall={isViewingCall}
                                    toggleIsViewingCall={toggleViewCall}
                                    type={callType}
                                    server={serverCall}
                                    channel={channelCall}
                                    user={userToCall}
                                    leaveCall={leaveCall}
                                />
                            )}
                        </div>
                    </div>
                    <UserBar userDetails={userDetails} isMicOn={isMicOn} isDeafened={isDeafened} toggleDeafened={toggleDeafened} toggleMic={toggleMic} />
                </div>
                {!isViewingCall && isViewingServer && <ChatBox channel={channel} server={server} />}
                {!isViewingCall && !isViewingServer && isViewingChat && <FriendChatBox toChatId={chatId} changeViewType={changeViewType} joinCall={joinCall} />}
                {!isViewingCall && !isViewingServer && !isViewingChat && <FriendBox changeUserToChat={changeUserToChat} />}
                {!isViewingCall && isViewingServer && <MemberList server={server} changeUserToChat={changeUserToChat} />}
                {isViewingCall && callType == 'channel' && <CallBox remoteTracks={remoteTracks} localUser={userDetails} serverId={serverCall.id} channelId={channelCall.id} localVideoTrack={localVideoTrack} localVideoOn={isVideoOn} />}
                {isViewingCall && callType != 'channel' && <FriendCallBox remoteTracks={remoteTracks} localUser={userDetails} localVideoTrack={localVideoTrack} localVideoOn={isVideoOn} remoteUserId={userToCall.id} />}
            </div>
        </>
    );
};

export default userMiddleware(HomePage);