import React, { useEffect } from 'react';

export default function CallBox ({ users, userDetails }) {
    useEffect(() => {
        users.forEach((user) => {
            if (user.videoTrack) {
                user.videoTrack.play(`user-${user.uid}`);
            }
        });
    }, [users]);

    return (
        <div className="w-full h-100vh bg-destructive">
            {users.map((user) => (
                user.uid !== userDetails.uid && (
                    <div key={user.uid} className="video-container">
                        <div id={`user-${user.uid}`} style={{ width: "200px", height: "200px" }}></div>
                    </div>
                )
            ))}
            <div id={`local-video-${userDetails.uid}`} style={{ width: "200px", height: "200px" }}></div>
        </div>
    );
};
