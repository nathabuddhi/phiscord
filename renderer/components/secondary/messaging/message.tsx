import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React, { useState, useEffect } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuItem } from "@/components/ui/context-menu";
import { Skeleton } from "@/components/ui/skeleton";
import EditMessage from "@/components/secondary/messaging/edit-message";
import DeleteMessage from "@/components/secondary/messaging/delete-message";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Linkify from 'react-linkify';
import LinkStyles from "@/styles/message.module.scss";

export default function Message({ message, server, channel }) {
    const [author, setAuthor] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [blocked, setBlocked] = useState(false);
    const [nickname, setNickname] = useState('');

    useEffect(() => {
        const authUser = getAuth().currentUser;
        const firestore = getFirestore();
        const authorDocRef = doc(firestore, "users", message.userId);
        const userDocRef = doc(firestore, "users", authUser.uid);
        const nicknameDocRef = doc(firestore, `servers/${server.id}/nicknames`, message.userId);

        const unsubscribeAuthor = onSnapshot(authorDocRef, (authorDoc) => {
            if (authorDoc.exists()) {
                setAuthor(authorDoc.data());
            } else {
                setAuthor(null);
            }
        });

        const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const { blocked = []} = userDoc.data();
                setBlocked(blocked.includes(message.userId));
                setUser(userDoc.data());
            }
        });

        const unsubcribeNickname = onSnapshot(nicknameDocRef, (nicknameDoc) => {
            if (nicknameDoc.exists()) {
                setNickname(nicknameDoc.data().nickname);
            } else {
                setNickname('');
            }
        });

        return () => {
            unsubscribeAuthor();
            unsubscribeUser();
            unsubcribeNickname();
        };
    }, [message.userId]);

    useEffect(() => {
        if (user && author) {
            setLoading(false);
        }
    }, [user, author]);

    const isAdminOrOwner = (userId) => {
        if (!server) return false;
        const { ownerId, admins = [] } = server;
        return userId === ownerId || admins.includes(userId);
    };

    const containsMention = () => {
        if (!message.content || !user)
            return false;
        return (message.content.includes(`@${user.username}`) || message.content.includes(`@${user.displayname}`) || message.content.includes(`@everyone`));
    }

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

    if (blocked) {
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
                <div className={`flex flex-row m-2 p-1 rounded-[10px] ${containsMention() ? "bg-[#8f845b] hover:bg-[#787051] dark:bg-[#484434] dark:hover:bg-[#423f30]" : "hover:bg-darkerbackground "}`}>
                    <Avatar>
                        <AvatarFallback className="border-[1px] border-serverlistbackground">
                            {author.avatarname}
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-2 flex flex-col">
                        <div className="flex flex-row items-center">
                            <p className={"text-base mr-2"}>
                                {nickname === '' ? author.displayname : nickname}
                            </p>
                            <p className="text-xs text-gray-400">{new Date(message.timestamp?.toDate()).toLocaleString()}</p>
                        </div>
                        {message.type === "image" ? (
                            <div className={`text-${user.font ? user.font : "base"}`}>
                                <p className="italic">Image: {message.fileName}</p>
                                <div className="max-w-full max-h-80">
                                    <img src={message.content} alt="Uploaded" className="w-auto max-w-full h-auto max-h-80 rounded" />
                                </div>
                                <div className='mt-2'>
                                    <Button className="w-auto">
                                        <Link href={message.content} rel="noopener noreferrer">
                                            View Original ({message.fileName ? message.fileName : "Unknown File Name"} - {message.fileSize ? message.fileSize : "Unknown File Size"})
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
            {user && author && (user.id === author.id || isAdminOrOwner(user.id)) && (
                <HoverCardContent className="w-auto">
                    {user.id === author.id && (
                        <EditMessage message={message} server={server} channel={channel} />
                    )}
                    <DeleteMessage message={message} server={server} channel={channel} />
                </HoverCardContent>
            )}
        </HoverCard>
    );
}
