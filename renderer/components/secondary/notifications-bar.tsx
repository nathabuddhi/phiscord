import { Bell, BellDot } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { onSnapshot, doc, collection, getFirestore, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";
import NotificationInfo from "@/components/secondary/tertiary/notification-info";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotificationsBar() {
    const { toast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const firestore = getFirestore();
    const auth = getAuth();
  
    useEffect(() => {
        const user = auth.currentUser;
        const notifCollection = collection(firestore, `users/${user.uid}/notifications`);
        const unsubscribe = onSnapshot(notifCollection, (snapshot) => {
            const notificationsList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setNotifications(notificationsList);
        },(error) => {
            setNotifications([]);
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed fetching your notifications: " + error.message,
            });
        });
        return () => unsubscribe();
    }, []);
  
    const deleteAllNotifs = async () => {
        const user = auth.currentUser;
        const notifQuery = collection(firestore, `users/${user.uid}/notifications`);
    
        try {
            await Promise.all(notifications.map((notif) => deleteDoc(doc(notifQuery, notif.id))));
            toast({
                title: "Success!",
                description: "All notifications have been deleted.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "We couldn't delete the notifications: " + error.message,
            });
        }
    };
  
    return (
        <>
            <Dialog>
                <DialogTrigger>
                    <Button variant="ghost" className="p-[4px] rounded-full" size="icon">
                        {notifications.length === 0 && <Bell size={24} />}
                        {notifications.length > 0 && <BellDot size={24} />}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Notifications</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        <ScrollArea className="max-h-96">
                            {notifications.length === 0 && "You have no unread notifications."}
                            {notifications.map((notif) => (
                                <>
                                    <NotificationInfo key={notif.id} notification={notif} user={auth.currentUser} />
                                    <Separator className="bg-darkerbackground" />
                                </>
                            ))}
                        </ScrollArea>
                    </DialogDescription>
                    <DialogFooter>
                        {notifications.length > 0 && <Button onClick={deleteAllNotifs}>Remove All</Button>}
                        {notifications.length === 0 && <Button onClick={deleteAllNotifs} disabled>Remove All</Button>}
                        <DialogClose>
                            <Button variant="outline" className="bg-darkerbackground hover:bg-serverlistbackground">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}