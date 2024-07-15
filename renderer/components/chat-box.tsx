import { Hash, SmilePlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit, startAfter, onSnapshot } from "firebase/firestore";
import Message from "@/components/secondary/messaging/message";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import UploadFile from "@/components/secondary/messaging/upload-file";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Picker from '@emoji-mart/react';
import { useTheme } from "next-themes";
import Filter from 'bad-words';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/components/firebase";

export default function ChatBox({ channel, server }) {
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const user = auth.currentUser;
    const { theme } = useTheme();
    const [searchMessage, setSearchMessage] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [lastVisibleMessage, setLastVisibleMessage] = useState(null);
    const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
    const [isLoadingMessage, setIsLoadingMessage] = useState(false);

    const filter = new Filter();

    const chatBoxBottom = useRef(null);

    useEffect(() => {
        if(isLoadingMessage) {
            setIsLoadingMessage(false);
            return;
        }
        chatBoxBottom.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async (channelId, serverId, lastVisibleMessage) => {
        const messagesCollectionRef = collection(db, `servers/${serverId}/textchannels/${channelId}/messages`);
        let messagesQuery = query(messagesCollectionRef, orderBy("timestamp", "desc"), limit(20));
        if (lastVisibleMessage) {
            messagesQuery = query(messagesCollectionRef, orderBy("timestamp", "desc"), startAfter(lastVisibleMessage), limit(20));
        }
        const snapshot = await getDocs(messagesQuery);
        const messagesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        return { messagesList, lastVisible, reachedEnd: snapshot.docs.length < 20 };
    };

    useEffect(() => {
        if (!server || !channel) {
            return;
        }

        const fetchInitialMessages = async () => {
            const { messagesList, lastVisible, reachedEnd } = await fetchMessages(channel.id, server.id, null);
            setMessages(messagesList.reverse());
            setLastVisibleMessage(lastVisible);
            setAllMessagesLoaded(reachedEnd);
        };

        fetchInitialMessages();

        const messagesCollectionRef = collection(db, `servers/${server.id}/textchannels/${channel.id}/messages`);
        const messagesQuery = query(messagesCollectionRef, orderBy("timestamp", "asc"));

        const newMessageListener = onSnapshot(messagesQuery, (snapshot) => {
            let newMessage;
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    newMessage = change.doc.data()
                }
            });
            if (newMessage != null) {
                setMessages(prevMessages => [...prevMessages, newMessage]);
                chatBoxBottom.current?.scrollIntoView({ behavior: "smooth" });
            }
        });

        return () => newMessageListener();
    }, [channel, server]);

    const loadMoreMessages = async () => {
        if (lastVisibleMessage) {
            const { messagesList, lastVisible, reachedEnd } = await fetchMessages(channel.id, server.id, lastVisibleMessage);
            setMessages(prevMessages => [...messagesList.reverse(), ...prevMessages]);
            setLastVisibleMessage(lastVisible);
            setAllMessagesLoaded(reachedEnd);
            setIsLoadingMessage(true);
        }
    };

    const sendMessage = async (content) => {
        if (!content.trim()) return;

        if (filter.isProfane(content)) {
            toast({
                variant: "destructive",
                title: "Profanity detected.",
                description: "Please refrain from using profanity in your messages. We want to keep PHiscord a safe and friendly place for everyone."
            });
            return;
        }

        try {
            const messagesCollectionRef = collection(db, `servers/${server.id}/textchannels/${channel.id}/messages`);
            await addDoc(messagesCollectionRef, {
                content: content,
                timestamp: serverTimestamp(),
                userId: user.uid,
                type: "text"
            });
            setMessageInput("");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to send message: " + error.message
            });
        }
    };

    const addEmoji = (emote) => {
        setMessageInput(input => input + emote.native);
    };

    const onDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const onDragEnter = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const onDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        const files = Array.from(event.dataTransfer.files);
        if (files.length > 0) {
            setFile(files[0]);
            setDialogOpen(true);
        }
    };

    const uploadFile = async () => {
        if (!file) {
            toast({
                variant: "destructive",
                title: "No file selected",
                description: "Please select a file to upload.",
            });
            return;
        }

        toast({
            title: "Uploading file.",
            description: "Please wait while we upload your file.",
        });

        const fileType = file.type.startsWith("image/") ? "image" : "file";
        const storageRef = ref(storage, `uploads/${server.id}/${channel.id}/${file.name}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            const messagesRef = collection(db, `servers/${server.id}/textchannels/${channel.id}/messages`);
            let fileSize;
            if (file.size >= 1024 * 1024 * 1024) {
                fileSize = (file.size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
            } else if (file.size >= 1024 * 1024) {
                fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
            } else {
                fileSize = (file.size / 1024).toFixed(2) + " KB";
            }

            await addDoc(messagesRef, {
                content: downloadURL,
                timestamp: serverTimestamp(),
                userId: user.uid,
                type: fileType,
                fileName: file.name,
                fileSize: fileSize
            });
            setFile(null);
            setDialogOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to upload file: " + error.message,
            });
        }
    };

    const searchedMessages = messages.filter(message => 
        message.content.toLowerCase().includes(searchMessage.toLowerCase())
    );

    return (
        <div
            className={`w-[calc(100vw-280px)] flex flex-col bg-background h-[calc(100vh-40px)] transition-all ${isDragging ? "border-dashed border border-black dark:border-gray-400" : "border-r-4 border-solid border-darkerbackground"}`}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div className="border-b-[1.5px] h-[50px] w-full border-darkerbackground rounded-b-[5px] flex flex-row items-center justify-between px-4">
                <div className="flex flex-row">
                    <Hash size={30} />
                    <h3 className="text-foreground font-bold text-lg ml-2">{channel ? channel.name : ""}</h3>
                </div>
                <div className="flex flex-row items-center bg-darkerbackground rounded-[10px] px-1">
                    <Search />
                    <Input 
                        placeholder="Search messages..."
                        value={searchMessage}
                        onChange={(e) => setSearchMessage(e.target.value)}
                        className="w-96 bg-darkerbackground ml-2"
                    />
                </div>
            </div>
            <ScrollArea className={`scroll-area h-[calc(100vh-125px)] ${messages.length <= 0 ? "flex w-full" : ""}`}>
                {!allMessagesLoaded && messages.length > 0 &&(
                    <div className="flex justify-center my-4">
                        <Button onClick={loadMoreMessages}>Load More Messages</Button>
                    </div>
                )}
                {allMessagesLoaded && messages.length > 0 &&(
                    <p className="text-center my-4 text-gray-500">You have reached the start of the chat.</p>
                )}
                {searchedMessages.length > 0 && searchedMessages.map(message => (
                    <Message message={message} server={server} channel={channel} key={message.id} />
                ))}
                {searchedMessages.length <= 0 && messages.length > 0 && (
                    <p className="text-xl italic text-center mt-[calc(87vh/2)]">No messages found matching your search query.</p>
                )}
                {messages.length <= 0 && (
                    <p className="text-xl italic text-center mt-[calc(87vh/2)]">No messages yet. Send one now to spice things up a bit!</p>
                )}
                <div ref={chatBoxBottom} />
            </ScrollArea>
            <div className="m-[10px] flex relative">
                <UploadFile server={server} channel={channel} />
                <Input
                    className="placeholder:italic bg-darkerbackground w-full"
                    placeholder={"Send a message to #" + (channel ? channel.name : "")}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            sendMessage(messageInput);
                        }
                    }}
                />
                <Popover>
                    <PopoverTrigger>
                        <Button variant="ghost" size="icon" className="ml-2">
                            <SmilePlus size={24} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                        <Picker onEmojiSelect={addEmoji} theme={theme} />
                    </PopoverContent>
                </Popover>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to upload this file?</DialogTitle>
                    </DialogHeader>
                    <p>{file && file.name}</p>
                    <DialogFooter>
                        <Button onClick={uploadFile}>
                            Upload
                        </Button>
                        <DialogClose>
                            <Button variant="destructive" onClick={() => setFile(null)}>Cancel</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
