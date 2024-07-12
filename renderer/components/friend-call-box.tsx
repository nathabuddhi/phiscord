import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';

export default function FriendCallBox({ localUser, remoteUserId, localVideoTrack, localVideoOn, remoteTracks }) {
    const [remoteUser, setRemoteUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.warn(remoteUserId);
        if(!localUser || !remoteUserId)
            return;

        const firestore = getFirestore();

        const toCallDocRef = doc(firestore, 'users', remoteUserId);
        const unsubscribe = onSnapshot(toCallDocRef, async (snapshot) => {
            if (snapshot.exists()) {
                setRemoteUser(snapshot.data());
            }
            setLoading(false);
        });

        if (localVideoOn) {
            const playLocalVideo = () => {
                const localVideoElement = document.getElementById(`local-${localUser.id}`);
                if (localVideoElement) {
                    localVideoTrack.play(`local-${localUser.id}`);
                } else {
                    setTimeout(playLocalVideo, 100);
                }
            };
            playLocalVideo();
        }

        return () => unsubscribe();

    }, [localUser.id, localVideoOn, localVideoTrack, remoteUserId]);

    useEffect(() => {
        const playVideoTracks = () => {
            remoteTracks.forEach((track) => {
                if (track.videoTrack) {
                    const videoElement = document.getElementById(`remote-${track.id}`);
                    if (videoElement) {
                        track.videoTrack.play(`remote-${track.id}`);
                    }
                }
            });
        };

        const waitVideoLoad = setTimeout(playVideoTracks, 100);

        return () => {
            clearTimeout(waitVideoLoad);
        };
    }, [remoteTracks]);

    if(loading)
        return null;

    return (
        <>
            <div className="w-full h-100vh bg-background flex justify-center items-center overflow-hidden">
                <div key={remoteUserId} className='w-[300px] h-[250px] bg-darkerbackground rounded-[15px] m-2 p-2 flex flex-col justify-center items-center'>
                    <div className="rounded-[10px] video-container w-full h-full flex justify-center items-center">
                        <div id={`remote-${remoteUserId}`} className='w-[280px] h-[200px] border-serverlistbackground border-solid border-2 rounded-[5px]' />
                    </div>
                    <p className='text-center mt-2 flex items-center'>
                        <Avatar asChild>
                            <AvatarFallback className='w-6 h-6 text-xs mr-2'>{remoteUser.avatarname}</AvatarFallback>
                        </Avatar>
                        {remoteUser.username}
                    </p>
                </div>
                <div key={localUser.id} className='w-[300px] h-[250px] bg-darkerbackground rounded-[15px] m-2 p-2 flex flex-col justify-center items-center'>
                    <div className="rounded-[10px] video-container w-full h-full flex justify-center items-center">
                        <div id={`local-${localUser.id}`} className='w-[280px] h-[200px] border-serverlistbackground border-solid border-2 rounded-[5px]' />
                    </div>
                    <p className='text-center mt-2 flex items-center justify-center'>
                        <Avatar asChild>
                            <AvatarFallback className='w-6 h-6 text-xs mr-2'>{localUser.avatarname}</AvatarFallback>
                        </Avatar>
                        {localUser.username}
                    </p>
                </div>
            </div>
        </>
    )
}