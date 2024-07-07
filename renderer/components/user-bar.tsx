import React, { useState, useEffect, useRef } from 'react';
import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { auth, db } from "@/components/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SettingsComponent from '@/components/settings/settings';

export default function UserBar({ userDetails, isMicOn, isDeafened, toggleDeafened, toggleMic }) {
    // const [isMicOn, setIsMicOn] = useState(true);
    // const [isVolumeOn, setIsVolumeOn] = useState(true);
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState("available");
    const [customStatus, setCustomStatus] = useState("");
    const isInitialRender = useRef(true);

    const changeStatus = async (value) => {
        if (value === 'custom') {
            setStatus(value);
        } else {
            setStatus(value);
            await updateStatus(value);
        }
    };

    const changeCustomStatus = async (event) => {
        const newCustomStatus = event.target.value;
        setCustomStatus(newCustomStatus);
        setStatus('custom');
        await updateStatus(newCustomStatus);
    };

    async function updateStatus(newStatus) {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, {
                    status: newStatus,
                });
                toast({
                    title: "Status updated!",
                    description: `Your status has been updated to ${newStatus}.`,
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
                    const initialStatus = userData.status === 'online' || userData.status === 'do not disturb' || userData.status === 'idle' || userData.status === 'invisible' ? userData.status : "custom";
                    setStatus(initialStatus);
                    setCustomStatus(initialStatus === 'custom' ? userData.status : '');
                }
            }, (error) => {
                console.error("Error fetching user data: ", error);
                setUser(null);
            });

            return () => unsubscribe();
        }
    }, [toast]);

    function getStatus() {
        if (status === 'custom') {
            return customStatus.length > 9 ? customStatus.slice(0, 6) + "..." : customStatus;
        }
        return status.length > 9 ? status.slice(0, 6) + "..." : status;
    }

    return (
        <>
            <div className="h-[50px] w-[280px] bg-barbackground flex flex-row items-center px-[10px] justify-between">
                <ModeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex flex-row justify-evenly hover:bg-barbackgroundhover hover:cursor-pointer rounded-[10px] px-[5px] py-[3px] m-0">
                            <Avatar>
                                <AvatarFallback>{user?.avatarname || user?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col ml-[10px] ">
                                <p className="text-sm">{user ? user.username : "Username"}</p>
                                <p className="text-xs">{user ? getStatus() : "Status"}</p>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="ml-4 w-64">
                        <DropdownMenuLabel>Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={status} onValueChange={changeStatus}>
                            <DropdownMenuRadioItem value="available">available</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="away from keyboard">away from keyboard</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="busy">busy</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="custom">custom</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        {status === 'custom' && (
                            <input
                                type="text"
                                placeholder="Enter custom status"
                                value={customStatus}
                                onChange={(e) => setCustomStatus(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        changeCustomStatus(e);
                                    }
                                }}
                                className="mt-2 p-1 border rounded w-full"
                            />
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
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
