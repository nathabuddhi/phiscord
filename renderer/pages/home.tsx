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
import { getDoc, doc, getFirestore, updateDoc, arrayUnion, arrayRemove, collection, deleteDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';
import FriendCallBox from '@/components/friend-call-box';
import { ToastAction } from "@/components/ui/toast";

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
    const [directCall, setDirectCall] = useState('');

    const firestore = getFirestore();

    const clientRef = useRef(null);
    const localAudioTrackRef = useRef(null);
    const localVideoTrackRef = useRef(null);
    const isInCallRef = useRef(isInCall);
    const isMicOnRef = useRef(isMicOn);
    const isDeafenedRef = useRef(isDeafened);
    const isVideoOnRef = useRef(isVideoOn);

    const APP_ID = "0403f6945a0d406c9efa7cb00f5c7aca";

    useEffect(() => {
        isInCallRef.current = isInCall;
    }, [isInCall]);

    useEffect(() => {
        isMicOnRef.current = isMicOn;
    }, [isMicOn]);

    useEffect(() => {
        isDeafenedRef.current = isDeafened;
    }, [isDeafened]);

    useEffect(() => {
        isVideoOnRef.current = isVideoOn;
    }, [isVideoOn]);

    useEffect(() => {
        localVideoTrackRef.current = localVideoTrack;
    }, [localVideoTrack]);

    useEffect(() => {
        localAudioTrackRef.current = localAudioTrack;
    }, [localAudioTrack]);

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
        const tempUser = getAuth().currentUser;
        const userDocRef = doc(firestore, "users", tempUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();

            if (!userData.messages.includes(userToChatId)) {
                await updateDoc(userDocRef, {
                    messages: arrayUnion(userToChatId)
                });
            }
        }

        setChatId(userToChatId);
        friendChatView();
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
            setIsVideoOn(prevState => !prevState);
        } else {
            try {
                const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
                const agoraClient = clientRef.current;
                const videoTrack = await AgoraRTC.createCameraVideoTrack();
                agoraClient.publish(videoTrack);
                setLocalVideoTrack(videoTrack);
                localVideoTrackRef.current = videoTrack;
    
                videoTrack.setEnabled(true);
                videoTrack.play(`local-${userDetails.id}`);
    
                setIsVideoOn(true);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description: "An error occurred while trying to toggle the video: " + error.message,
                });
            }
        }
    };
    

    const toggleMic = async() => {
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.setEnabled(!isMicOn);
        } else if(isInCallRef.current) {
            try {
                const AgoraRTC = await import("agora-rtc-sdk-ng").then((mod) => mod.default);
                const agoraClient = clientRef.current;
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                await agoraClient.publish(audioTrack);
                setLocalAudioTrack(audioTrack);
                localAudioTrackRef.current = audioTrack;
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description: "An error occurred while trying to toggle the microphone: " + error.message,
                })
            }
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

    const addJoinedUser = async (dmID, userId) => {
        const dmDocRef = doc(firestore, 'directmessages/', dmID);

        await updateDoc(dmDocRef, {
            joined: arrayUnion(userId),
        });
    }

    const removeJoinedUser = async (dmID, userId) => {
        const dmDocRef = doc(firestore, 'directmessages/', dmID);

        await updateDoc(dmDocRef, {
            joined: arrayRemove(userId),
        })
    }

    const addJoinedMember = async (serverId, channelId, userId) => {
        const channelDocRef = doc(firestore, `servers/${serverId}/voicechannels`, channelId);

        await updateDoc(channelDocRef, {
            joined: arrayUnion(userId),
        });
    }

    const removeJoinedMember = async (serverId, channelId, userId) => {
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
        let agoraChannelName;
        setCallType(type);
        if (type === "channel") {
            setServerCall(server);
            setChannelCall(channel);
            setUserToCall(null);
            agoraChannelName = channel.id;
        } else if (type === "user") {
            setServerCall(null);
            setChannelCall(null);
            setUserToCall(userToCall);
            agoraChannelName = directMessageID;
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

                await agoraClient.join(APP_ID, agoraChannelName, null, userDetails.id);

                if(isMicOn) {
                    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                    await agoraClient.publish(audioTrack);
                    setLocalAudioTrack(audioTrack);
                    localAudioTrackRef.current = audioTrack;
                }

                agoraClient.on("user-published", handleUserPublished);
                agoraClient.on("user-unpublished", handleUserUnpublished);
                agoraClient.on("user-left", handleUserLeft);

                setIsInCall(true);
                setIsViewingCall(true);
                if(type === 'channel')
                    addJoinedMember(server.id, channel.id, userDetails.id);
                else {
                    addJoinedUser(directMessageID, userDetails.id);
                    setDirectCall(directMessageID);
                    const dmDocRef = doc(firestore, 'directmessages/', directMessageID);
                    const dmDoc = await getDoc(dmDocRef);
                    if(dmDoc.exists()) {
                        if(!dmDoc.data().joined.includes(userToCall.id)) {
                            const addNotificationDocRef = collection(firestore, `users/${userToCall.id}/toastNotifications`);
                            await addDoc(addNotificationDocRef, {
                                title: "Incoming Call",
                                description: `${userDetails.username} is currently calling you.`,
                                senderId: userDetails.id,
                            });
                        }
                    }
                }
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
                if(isDeafened)
                    user.audioTrack.setVolume(0);
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
        setLocalAudioTrack(null);
        setLocalVideoTrack(null);
        setServerCall(null);
        setChannelCall(null);
        setUserToCall(null);
        setDirectCall('');

        if(callType === 'channel') {
            removeJoinedMember(serverCall.id, channelCall.id, userDetails.id);
        } else {
            removeJoinedUser(directCall, userDetails.id)
        }

        if (localAudioTrackRef.current)
            localAudioTrackRef.current.close();
        if (localVideoTrack)
            localVideoTrack.close();
        const client = clientRef.current;
        if (client)
            client.leave();

        setRemoteTracks([]);
    };

    const toastNotificationListener = () => {
        const notificationsCollectionRef = collection(firestore, `users/${userDetails.id}/toastNotifications`);
    
        onSnapshot(notificationsCollectionRef, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    toast({
                        duration: 30000,
                        title: data.title,
                        description: data.description,
                        action: <ToastAction altText='Login' onClick={() => changeUserToChat(data.senderId)}>Jump</ToastAction>
                    });
                    await deleteDoc(change.doc.ref);
                }
            });
        });
    };

    useEffect(() => {
        toastNotificationListener();
    }, []);

    useEffect(() => {
        const removeMicListener = window.ipc.on('toggle-mic', () => {
            toggleMic();
        });
    
        const removeDeafenListener = window.ipc.on('toggle-deafen', () => {
            toggleDeafened();
        });
    
        const removeVideoListener = window.ipc.on('toggle-video', () => {
            toggleVideo();
        });
    
        const removeLeaveCallListener = window.ipc.on('leave-call', () => {
            leaveCall();
        });
    
        return () => {
            removeMicListener();
            removeDeafenListener();
            removeVideoListener();
            removeLeaveCallListener();
        };
    }, []);
    
    useEffect(() => {
        window.ipc.send('update-thumbar-buttons', {isInCall, isMicOn, isDeafened, isVideoOn});
    }, [isInCall, isMicOn, isDeafened, isVideoOn]);

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