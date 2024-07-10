import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';

export default function FriendCallBox({ localUser, remoteUserId, localVideoTrack, localVideoOn, remoteUserTrack }) {
    const [remoteUser, setRemoteUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const firestore = getFirestore();

        const toCallDocRef = doc(firestore, 'users', remoteUserId);
        const unsubcribe = onSnapshot(toCallDocRef, async (snapshot) => {
            if (snapshot.exists()) {
                setRemoteUser(snapshot.data());
            }
            setLoading(false);
        })

        if (localVideoOn) {
            const localVideoElement = document.getElementById(`local-${localUser.id}`);
            if (localVideoElement) {
                localVideoTrack.play(`local-${localUser.id}`);
            }
        }

        return () => unsubcribe();

    }, [localUser.id, localVideoOn, localVideoTrack, remoteUserId])

    useEffect(() => {
        const playVideoTracks = () => {
            if (remoteUserTrack && remoteUserTrack.videoTrack) {
                const videoElement = document.getElementById(`remote-${remoteUserId}`);
                if (videoElement) {
                    remoteUserTrack.videoTrack.play(`remote-${remoteUserId}`);
                }
            }
        };

        const waitVideoLoad = setTimeout(playVideoTracks, 100);

        return () => {
            clearTimeout(waitVideoLoad);
        };
    }, [remoteUserTrack]);

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