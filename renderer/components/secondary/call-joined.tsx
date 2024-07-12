import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getFirestore, getDoc, doc, onSnapshot } from "firebase/firestore";

export default function CallJoined({ userId, serverId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [nickname, setNickname] = useState('');
    
    useEffect(() => {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, "users", userId);
        const nicknameDocRef = doc(firestore, `servers/${serverId}/nicknames`, userId);

        const unsubcribeNickname = onSnapshot(nicknameDocRef, (nicknameDoc) => {
            if (nicknameDoc.exists()) {
                setNickname(nicknameDoc.data().nickname);
            } else {
                setNickname('');
            }
        });

        const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                setUser(userDoc.data());
                setLoading(false);
            } else {
                setUser(null);
            }
        }, (error) => {
            setUser(null);
        });

        return () => {
            unsubscribeUser();
            unsubcribeNickname();
        };
    }, [userId]);

    if(loading || !user)
        return null;

    return (
        <>
            <div className="flex flex-row ml-10 mb-2 items-center">
                <Avatar asChild>
                    <AvatarFallback className="w-6 h-6 text-xs">{user.avatarname}</AvatarFallback>
                </Avatar>
                <p className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                    {nickname === '' ? user.displayname : nickname}
                </p>
            </div>
        </>
    )
}