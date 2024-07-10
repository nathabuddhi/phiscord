import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React, { useState, useEffect } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import EditDMMessage from "@/components/secondary/messaging/edit-dm-message";
import DeleteDMMessage from "@/components/secondary/messaging/delete-dm-message";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Linkify from 'react-linkify';
import LinkStyles from "@/styles/message.module.scss";

export default function DirectMessage({ message, dmID }) {
    const [author, setAuthor] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [blocked, setBlocked] = useState(false);

    useEffect(() => {
        const authUser = getAuth().currentUser;
        setUser(authUser);
        const firestore = getFirestore();
        const authorDocRef = doc(firestore, "users", message.userId);
        const userDocRef = doc(firestore, "users", authUser.uid);

        const unsubscribeAuthor = onSnapshot(authorDocRef, (authorDoc) => {
            if (authorDoc.exists()) {
                setAuthor(authorDoc.data());
            } else {
                setAuthor(null);
            }
        });

        const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const { blocked = [] } = userDoc.data();
                setBlocked(blocked.includes(message.userId));
                setUser(userDoc.data());
            }
        });

        return () => {
            unsubscribeAuthor();
            unsubscribeUser();
        };
    }, [message.userId]);

    useEffect(() => {
        if (user && author) {
            setLoading(false);
        }
    }, [user, author]);

    if (loading) {
        return (
            <div className="flex flex-row m-2 hover:bg-darkerbackground p-1 rounded-[10px]">
                <Skeleton className="h-10 w-10 rounded-full border-[1px] border-serverlistbackground" />
                <div className="ml-2 flex flex-col">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
        );
    }

    if(blocked) {
        return (
            <div className="flex flex-row m-2 hover:bg-darkerbackground p-1 rounded-[10px]">
                    <Avatar>
                        <AvatarFallback className="border-[1px] border-serverlistbackground">
                            ??
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-2 flex flex-col">
                        <div className="flex flex-row items-center">
                            <p className="text-base mr-2 italic">
                                Blocked User 
                            </p>
                            <p className="text-xs text-gray-400">{new Date(message.timestamp?.toDate()).toLocaleString()}</p>
                        </div>
                        <p className="italic">Content from blocked users will not be shown.</p>
                    </div>
                </div>
        )
    }

    return (
        <HoverCard openDelay={1000} closeDelay={100}>
            <HoverCardTrigger>
                <div className="flex flex-row m-2 hover:bg-darkerbackground p-1 rounded-[10px]">
                    <Avatar>
                        <AvatarFallback className="border-[1px] border-serverlistbackground">
                            {author.avatarname}
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-2 flex flex-col">
                        <div className="flex flex-row items-center">
                            <p className={"text-base mr-2"}>
                                {author.displayname}
                            </p>
                            <p className="text-xs text-gray-400">{new Date(message.timestamp?.toDate()).toLocaleString()}</p>
                        </div>
                        {message.type === "image" ? (
                            <div className={`text-${user.font ? user.font : "base"}`}>
                                <p className="italic">Image: {message.fileName}</p>
                                <div className="max-w-full max-h-80">
                                    <img src={message.content} alt="Uploaded" className="w-auto max-w-full h-auto max-h-80 rounded" />
                                </div>
                                <div className="mt-2">
                                    <Button className="w-auto">
                                        <Link href={message.content} rel="noopener noreferrer">
                                            Download Image ({message.fileName ? message.fileName : "Unknown File Name"} - {message.fileSize ? message.fileSize : "Unknown File Size"})
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (message.type === "file" ? (
                                <div className={`text-${user.font ? user.font : "base"}`}>
                                    <p className="italic">File: {message.fileName}</p>
                                    <Button>
                                        <Link href={message.content} rel="noopener noreferrer">
                                            Download File ({message.fileName ? message.fileName : "Unknown File Name"} - {message.fileSize ? message.fileSize : "Unknown File Size"})
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                            <Linkify componentDecorator={(decoratedHref, decoratedText, key) => (
                                <a href={decoratedHref} key={key} className={LinkStyles.messageLink} target="_blank" rel="noopener noreferrer">
                                    {decoratedText}
                                </a>
                                )}>
                                <div className={`text-${user.font ? user.font : "base"}`}>
                                    <p className={LinkStyles.messageLink}>{message.content}</p>
                                </div>
                            </Linkify>
                        ))}
                    </div>
                </div>
            </HoverCardTrigger>
            {user && author && (user.uid === author.id) && (
                <HoverCardContent className="w-auto">
                    {user.uid === author.id && (
                        <EditDMMessage message={message} dmID={dmID} />
                    )}
                    <DeleteDMMessage message={message} dmID={dmID} />
                </HoverCardContent>
            )}
        </HoverCard>
    );
}
