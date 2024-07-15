import React, { useState, useEffect } from 'react';
import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Mic, MicOff, Fingerprint } from "lucide-react";
import { auth, db } from "@/components/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SettingsComponent from '@/components/settings/settings';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function UserBar({ userDetails, isMicOn, isDeafened, toggleDeafened, toggleMic }) {
    const { toast } = useToast();
    const [user, setUser] = useState(null);

    async function updateStatus(event) {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, {
                    status: event.target.value,
                });
                toast({
                    title: "Status updated!",
                    description: `Your status has been updated to ${event.target.value}.`,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to update status!",
                description: error.message,
            });
        }
    }

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                    setUser(userData);
                }
            }, (error) => {
                setUser(null);
            });

            return () => unsubscribe();
        }
    }, [toast]);

    function getStatus() {
        if(!user.status)
            return;
        return user.status.length > 9 ? user.status.slice(0, 6) + "..." : user.status;
    }

    function getUsername() {
        if(!user.username)
            return;
        return user.username.length > 9 ? user.username.slice(0, 6) + "..." : user.username;
    }

    return (
        <>
            <div className="h-[50px] w-[280px] bg-barbackground flex flex-row items-center px-[10px] justify-between">
                <ModeToggle />
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex flex-row justify-evenly hover:bg-barbackgroundhover hover:cursor-pointer rounded-[10px] px-[5px] py-[3px] m-0">
                            <Avatar>
                                <AvatarFallback>{user ? user.avatarname : "??"}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col ml-[10px] ">
                                <p className="text-sm">{user ? getUsername() : "Username"}</p>
                                <p className="text-xs">{user ? getStatus() : "Status"}</p>
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="ml-4 w-64">
                        <Label>Profile</Label>
                        <div className='m-2'>
                            <div className='flex flex-row justify-between items-center'>
                                <Avatar asChild>
                                    <AvatarFallback className='w-12 h-12 text-xl'>{user ? user.avatarname : "??"}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col ml-[10px] ">
                                    <p className="text-xl">{user ? user.displayname : "Display name"}</p>
                                    <p className="text-base text-gray-600 dark:text-gray-300">{user ? user.username : "Username"}</p>
                                </div>
                            </div>
                        </div>
                        <Separator className='my-1' />
                        <Label>Status</Label>
                        <input
                            type="text"
                            placeholder="Enter custom status"
                            defaultValue={user ? user.status : ""}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    updateStatus(e);
                                }
                            }}
                            className="mt-2 p-1 border rounded w-full"
                        />
                        <Separator className='my-2' />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant='outline' className='w-full flex' onClick={() => navigator.clipboard.writeText(user ? user.id : "(ID_NOT_FOUND)")}>
                                    <Fingerprint className='mr-2' />
                                    Copy user ID
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Success!</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Your user ID has been copied to your clipboard.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Close</AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </PopoverContent>
                </Popover>
                <div className="flex">
                    <Button variant="ghost" onClick={toggleMic} size='icon' className='w-8 h-8'>
                        {isMicOn ? <Mic /> : <MicOff />}
                    </Button>
                    <Button variant="ghost" onClick={toggleDeafened} size='icon' className='w-8 h-8'>
                        {isDeafened ? <VolumeX /> : <Volume2 />}
                    </Button>
                    <SettingsComponent userDetails={userDetails} />
                </div>
            </div>
        </>
    );
}
