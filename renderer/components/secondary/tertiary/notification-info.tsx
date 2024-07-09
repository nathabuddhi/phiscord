import { Button } from "@/components/ui/button";
import { getFirestore, doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function NotificationInfo({ user, notification }) {
    const { toast } = useToast();
    const firestore = getFirestore();
    const [sender, setSender] = useState(null);

    useEffect(() => {
        const senderDocRef = doc(firestore, "users", notification.from);
        const unsubcribe = onSnapshot(senderDocRef, (snapshot) => {
            if(snapshot.exists()) {
                setSender(snapshot.data());
            }
        });

        return () => unsubcribe();
    }, [])

    const deleteNotification = async () => {
        const notifDocRef = doc(firestore, `users/${user.uid}/notifications`, notification.id);
    
        try {
            await deleteDoc(notifDocRef);
            toast({
                title: "Success!",
                description: "The notification has been deleted.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "We couldn't delete the notification: " + error.message,
            });
        }
    };

    return (
        <>
            <div className="flex flex-row items-center justify-between m-1">
                <div className="flex flex-row items-center">
                    <Avatar asChild>
                        <AvatarFallback className="w-10 h-10">
                            <p className="text-sm">{sender && sender.avatarname}</p>
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-semibold ml-2">{sender && sender.username}</p>
                        <p className="text-xs text-gray-400 ml-2">{notification.content}</p>
                    </div>
                </div>
                <Button variant="logout" size="sm" onClick={deleteNotification}>Remove</Button>
            </div>
        </>
    )
}