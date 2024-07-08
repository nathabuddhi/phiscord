import React, { useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function CallBox({ users, userDetails }) {
    useEffect(() => {
        users.forEach((user) => {
            if (user.videoTrack) {
                user.videoTrack.play(`user-${user.id}`);
            }
        });
    }, [users]);

    return (
        <div className="w-full h-100vh bg-background flex justify-center items-center overflow-hidden">
            {users.map((user) => (
                <div key={user.id} className='w-[300px] h-[250px] bg-darkerbackground rounded-[15px] m-2 p-2 flex flex-col justify-center items-center'>
                    <div className="rounded-[10px] video-container w-full h-full flex justify-center items-center">
                        <div id={`user-${user.id}`} style={{ width: "200px", height: "200px", display: user.videoTrack ? 'block' : 'none' }} />
                        {!user.videoTrack && (
                            <Avatar>
                                <AvatarFallback>{user.avatar}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                    <p className='text-center mt-2'>
                        {user.id === userDetails.id ? 'You' : user.username}
                    </p>
                </div>
            ))}
        </div>
    );
}
