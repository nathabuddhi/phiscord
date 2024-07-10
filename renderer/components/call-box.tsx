import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';

export default function CallBox({ localUser, serverId, channelId, localVideoTrack, localVideoOn, remoteTracks }) {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const firestore = getFirestore();
        const channelDocRef = doc(firestore, `servers/${serverId}/voicechannels`, channelId);

        const unsubscribeChannel = onSnapshot(channelDocRef, async (snapshot) => {
            if (snapshot.exists()) {
                const channel = snapshot.data();
                const userIds = channel.joined;

                const userUnsubscribes = [];

                const userPromises = userIds.map((userId) => {
                    const userDocRef = doc(firestore, 'users', userId);

                    return new Promise((resolve) => {
                        const unsubscribeUser = onSnapshot(userDocRef, (userSnapshot) => {
                            if (userSnapshot.exists()) {
                                resolve({ id: userId, ...userSnapshot.data() });
                            } else {
                                resolve(null);
                            }
                        });

                        userUnsubscribes.push(unsubscribeUser);
                    });
                });

                const userData = await Promise.all(userPromises);
                const validUsers = userData.filter(user => user !== null);
                setUsers(validUsers);

                return () => {
                    userUnsubscribes.forEach((unsubscribe) => unsubscribe());
                };
            }
        });

        if (localVideoOn) {
            const localVideoElement = document.getElementById(`local-${localUser.id}`);
            if (localVideoElement) {
                localVideoTrack.play(`local-${localUser.id}`);
            }
        }

        return () => {
            unsubscribeChannel();
        };
    }, [localUser.id, localVideoOn, localVideoTrack, serverId, channelId]);

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

    return (
        <div className="w-full h-100vh bg-background flex justify-center items-center overflow-hidden">
            {users.map((user) => (
                user.id !== localUser.id &&
                <div key={user.id} className='w-[300px] h-[250px] bg-darkerbackground rounded-[15px] m-2 p-2 flex flex-col justify-center items-center'>
                    <div className="rounded-[10px] video-container w-full h-full flex justify-center items-center">
                        <div id={`remote-${user.id}`} className='w-[280px] h-[200px] border-serverlistbackground border-solid border-2 rounded-[5px]' />
                    </div>
                    <p className='text-center mt-2 flex items-center'>
                        <Avatar asChild>
                            <AvatarFallback className='w-6 h-6 text-xs mr-2'>{user.avatarname}</AvatarFallback>
                        </Avatar>
                        {user.username}
                    </p>
                </div>
            ))}
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
    );
}