import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ChevronDown, X } from 'lucide-react';
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import NewChannel from "@/components/secondary/serversettings/new-channel";
import ServerSettings from "@/components/secondary/serversettings/server-settings";
import { Separator } from "@/components/ui/separator";
import { getAuth } from "firebase/auth";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast";
import { getFirestore, doc, updateDoc, arrayRemove } from "firebase/firestore";
import ChangeNickname from "@/components/secondary/serversettings/change-nickname";

export default function ServerInfo({ server, changeViewType }) {
    const [infoOpen, setInfoOpen] = useState(false);
    const { toast } = useToast();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchCurrentUser = () => {
            const auth = getAuth();
            const user = auth.currentUser;
            setUser(user);
        };
        fetchCurrentUser();
    }, []);

    const toggleInfo = () => {
        setInfoOpen(prevState => !prevState);
    }

    const isOwner = (userId) => {
        if (!server)
            return false;
        if(userId === server.ownerId)
            return true;
        return false;
    };

    const isAdmin = (userId) => {
        if (!server)
            return false;
        const { admins = [] } = server;
        if(admins.includes(userId))
            return true;
        return false;
    };

    const leaveServer = async () => {
        try {
            const firestore = getFirestore();
            const serverDocRef = doc(firestore, "servers", server.id);

            await updateDoc(serverDocRef, {
                members: arrayRemove(user.uid),
            });

            toast({
                title: "Success!",
                description: "You have left the server.",
            });
            changeViewType(2);
        } catch (error) {
            console.log(error.message);
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Unable to leave server: " + error.message,
            })
        }
    }

    return (
        <>
            <Popover onOpenChange={toggleInfo}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="rounded-none rounded-br-[5px] bg-darkerbackground  border-solid border-serverlistbackground border-b-[1.5px] border-r-[1.75px] h-[50px] w-[200px] flex flex-row justify-between">
                        <div>{server ? server.name : "Server Name"}</div>
                        {infoOpen ? <X /> : <ChevronDown />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] bg-serverlistbackground flex flex-col py-2 px-3">
                    <Label className="text-center mb-3 text-xl">{server ? server.name : "Server Name"}</Label>
                    <Separator />
                    <ChangeNickname serverId={server.id} />
                    <Separator />
                    {user && (isOwner(user.uid) || isAdmin(user.uid)) &&
                        <>
                            <ServerSettings server={server} changeViewType={changeViewType} />
                            <NewChannel server={server} />
                            <Separator />
                        </>
                    }
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="my-1" onClick={() => {navigator.clipboard.writeText("Come join my PHiscord server called '" + server.name + "'! Here's the server ID to my server: " + server.id)}}>Invite People</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Server ID Copied!</AlertDialogTitle>
                            <AlertDialogDescription>
                                Go ahead and send this ID to your friends so they can join your server!.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Close</AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    {user && !isOwner(user.uid) &&
                        <>
                            <Separator />
                            <Button variant="destructive" className="my-1" onClick={() => leaveServer()}>Leave Server</Button>
                        </>
                    }
                </PopoverContent>
            </Popover>
        </>
    )
}