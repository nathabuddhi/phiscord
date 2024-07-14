import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import FriendInfo from "@/components/secondary/friend-info";
import RequestList from "@/components/secondary/request-list";
import BlockInfo from "@/components/secondary/block-info";

export default function FriendBox({ changeUserToChat }) {
    const { toast } = useToast();

    const [onlineFriends, setOnlineFriends] = useState([]);
    const [friends, setFriends] = useState([]);
    const [blocked, setBlocked] = useState([]);

    useEffect(() => {
        const firestore = getFirestore();
        const auth = getAuth();
        const tempUser = auth.currentUser;
        const userDocRef = doc(firestore, "users", tempUser.uid);

        const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setFriends(userData.friends || []);
                setBlocked(userData.blocked || []);
            } else {
                setFriends([]);
                setBlocked([]);
            }
        }, (error) => {
            setFriends([]);
            setBlocked([]);
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to fetch friends and blocked users: " + error.message
            })
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="w-[calc(100vw-280px)] flex flex-col bg-background">
            <Tabs defaultValue="online" className="w-full h-[calc(100vh-80px)] m-0">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="online">Online</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="blocked">Blocked</TabsTrigger>
                </TabsList>
                <TabsContent value="online" className="w-full h-full m-0">
                    <Card className="w-full h-full">
                        <CardHeader>
                            <CardTitle>Online Friends</CardTitle>
                            <CardDescription>
                                All your friends that are currently online.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {onlineFriends.length > 0 && onlineFriends.map(friend => (
                                <FriendInfo friendId={friend} changeUserToChat={changeUserToChat} />
                            ))}
                            {onlineFriends.length === 0 && <p className="text-center text-gray-500">This feature is upcoming. You can currently only view all your friends in the "All" tab. Stay tuned for updates from LC118!</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="all" className="w-full h-full m-0">
                    <Card className="w-full h-full">
                        <CardHeader>
                            <CardTitle>All Friends</CardTitle>
                            <CardDescription>
                                All your friends.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {friends.length > 0 && friends.map(friend => (
                                <FriendInfo friendId={friend} changeUserToChat={changeUserToChat} />
                            ))}
                            {friends.length === 0 && <p className="text-center text-gray-500">You have no friends yet :(</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="pending" className="w-full h-full m-0">
                    <Card className="w-full h-full">
                        <CardHeader>
                            <CardTitle>Pending Friend Requests</CardTitle>
                            <CardDescription>
                                Outgoing and incoming friend reqeusts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RequestList  />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="blocked" className="w-full h-full m-0">
                    <Card className="w-full h-full">
                        <CardHeader>
                            <CardTitle>Blocked Users</CardTitle>
                            <CardDescription>
                                Users you have blocked.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {blocked.length > 0 && blocked.map(block => (
                                <BlockInfo blockedId={block}/>
                            ))}
                            {blocked.length === 0 && <p className="text-center text-gray-500">You have no blocked users.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
