import { Hash, SmilePlus, Search, PhoneCall } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, use, useRef } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc, getDocs, where, getDoc, arrayUnion, updateDoc } from "firebase/firestore";
import DirectMessage from "@/components/secondary/messaging/dm-message";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuth } from "firebase/auth";
import UploadDMFile from "@/components/secondary/messaging/upload-dm-file";
import Head from "next/head";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Picker from '@emoji-mart/react';
import { useTheme } from "next-themes";
import Filter from 'bad-words';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function FriendChatBox({ toChatId, changeViewType, joinCall }) {
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const firestore = getFirestore();
    const [currUser, setCurrUser] = useState(null);
    const [toChatUser, setToChatUser] = useState(null);
    const [directMessageId, setDirectMessageId] = useState(null);
    const [unsubscribeMessages, setUnsubscribeMessages] = useState(null);
    const { theme } = useTheme();
    const [searchMessage, setSearchMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const storage = getStorage();
    const [file, setFile] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const filter = new Filter();

    const chatBoxBottom = useRef(null)

    useEffect(() => {
        chatBoxBottom.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages]);

    useEffect(() => {
        const tempUser = getAuth().currentUser;

        if (!toChatId) {
            changeViewType(2);
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to fetch user data: Please try again."
            })
            return;
        }

        const userDocRef = doc(firestore, "users", tempUser.uid);
        const toChatDocRef = doc(firestore, "users", toChatId);

        const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                setCurrUser(snapshot.data());
            }
        }, (error) => {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to fetch user data: " + error.message
            });
            changeViewType(2);
        });

        const unsubscribeToChat = onSnapshot(toChatDocRef, (snapshot) => {
            if (snapshot.exists()) {
                setToChatUser(snapshot.data());
            }
        }, (error) => {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to fetch user data: " + error.message
            });
            changeViewType(2);
        });

        return () => {
            unsubscribeUser();
            unsubscribeToChat();
            if (unsubscribeMessages) {
                unsubscribeMessages();
            }
        };
    }, [toChatId]);

    useEffect(() => {
        if (currUser && toChatUser) {
            const checkAndCreateDM = async () => {
                if (!currUser || !toChatUser) return;
                const dmQuery = query(collection(firestore, "directmessages"), where("participants", "array-contains", currUser.id));
                const dmSnapshot = await getDocs(dmQuery);
                let dmDoc = dmSnapshot.docs.find(doc => doc.data().participants.includes(toChatId));

                if (!dmDoc) {
                    const newDMRef = await addDoc(collection(firestore, "directmessages"), {
                        participants: [currUser.id, toChatId],
                    });
                    await setDoc(newDMRef, { id: newDMRef.id }, { merge: true });
                    setDirectMessageId(newDMRef.id);
                    dmDoc = await getDoc(newDMRef);
                } else {
                    setDirectMessageId(dmDoc.id);
                }

                if (unsubscribeMessages) {
                    unsubscribeMessages();
                }

                const unsubscribe = onSnapshot(query(collection(firestore, `directmessages/${dmDoc.id}/messages`), orderBy("timestamp", "asc")), (snapshot) => {
                    const messagesList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setMessages(messagesList);
                });

                setUnsubscribeMessages(() => unsubscribe);
                setLoading(false);
            };

            checkAndCreateDM();
        }
    }, [currUser, toChatUser]);

    const sendMessage = async (content) => {
        if (!content.trim()) return;

        if(toChatUser.blocked.includes(currUser.id)) {
            toast({
                variant: "destructive",
                title: "Blocked.",
                description: "You cannot send messages to this user because you have been blocked."
            });
            return;
        } else if(currUser.blocked.includes(toChatUser.id)) {
            toast({
                variant: "destructive",
                title: "Blocked",
                description: "You cannot send messages to users you have blocked."
            });
            return;
        } else if(!toChatUser.friends.includes(currUser.id) && !toChatUser.randomMessage) {
            toast({
                variant: "destructive",
                title: "Not friends",
                description: "You cannot send messages to this user because you are not friends and this user is not accepting messages from non-friends."
            });
            return;
        } else if(filter.isProfane(content)) {
            toast({
                variant: "destructive",
                title: "Profanity detected.",
                description: "Please refrain from using profanity in your messages. We want to keep PHiscord a safe and friendly place for everyone."
            })
            return;
        } else if(!toChatUser.messages.includes(currUser.id)) {
            const receiverDocRef = doc(firestore, "users", toChatUser.id);

            await updateDoc(receiverDocRef, {
                messages: arrayUnion(currUser.id)
            });
        }

        try {
            const addNotificationDocRef = collection(firestore, `users/${toChatUser.id}/toastNotifications`);
            await addDoc(addNotificationDocRef, {
                title: "New Message",
                description: `${currUser.username} sent you a direct message.`,
                senderId: currUser.id,
                duration: 3000,
            });
            const messagesRef = collection(firestore, `directmessages/${directMessageId}/messages`);
            await addDoc(messagesRef, {
                content: content,
                timestamp: serverTimestamp(),
                userId: currUser.id,
                type: "text"
            });
            const notifQuery = collection(firestore, `users/${toChatUser.id}/notifications`);
            await addDoc(notifQuery, {
                content: "Sent you a message.",
                from: currUser.id,
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

        if(toChatUser.blocked.includes(currUser.id)) {
            toast({
                variant: "destructive",
                title: "Blocked.",
                description: "You cannot send messages to this user because you have been blocked."
            });
            return;
        } else if(currUser.blocked.includes(toChatUser.id)) {
            toast({
                variant: "destructive",
                title: "Blocked",
                description: "You cannot send messages to users you have blocked."
            });
            return;
        } else if(!toChatUser.friends.includes(currUser.id) && !toChatUser.randomMessage) {
            toast({
                variant: "destructive",
                title: "Not friends",
                description: "You cannot send messages to this user because you are not friends and this user is not accepting messages from non-friends."
            });
            return;
        }  else if(!toChatUser.messages.includes(currUser.id)) {
            const receiverDocRef = doc(firestore, "users", toChatUser.id);

            await updateDoc(receiverDocRef, {
                messages: arrayUnion(currUser.id)
            });
        }

        toast({
            title: "Uploading file.",
            description: "Please wait while we upload your file.",
        })

        const fileType = file.type.startsWith("image/") ? "image" : "file";
        const storageRef = ref(storage, `uploads/${directMessageId}/${file.name}`);
        try {
            const addNotificationDocRef = collection(firestore, `users/${toChatUser.id}/toastNotifications`);
            await addDoc(addNotificationDocRef, {
                title: "New Message",
                description: `${currUser.username} sent you a file`,
                senderId: currUser.id,
                duration: 3000,
            });
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            const messagesRef = collection(firestore, `directmessages/${directMessageId}/messages`);
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
                userId: currUser.id,
                type: fileType,
                fileName: file.name,
                fileSize: fileSize
            });
            setFile(null);
            setDialogOpen(false);

            const notifQuery = collection(firestore, `users/${toChatId}/notifications`);
            await addDoc(notifQuery, {
                content: "Sent you a file.",
                from: currUser.id,
            });
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

    if(loading)
        return null;

    return (
        <div
            className={`w-[calc(100vw-280px)] flex flex-col bg-background h-[calc(100vh-40px)] transition-all ${isDragging ? "border-dashed border border-black" : "border-solid border-darkerbackground"}`}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <Head>
                <title>{toChatUser ? toChatUser.username : "Direct Message"} - PHiscord</title>
            </Head>
            <div className="border-b-[1.5px] h-[50px] w-full border-darkerbackground rounded-b-[5px] flex flex-row items-center justify-between px-4">
                <div className="flex flex-row">
                <Hash size={30} className="self-center" />
                <h3 className="text-foreground font-bold text-lg ml-2 self-center">{toChatUser ? toChatUser.username : "Direct Message"}</h3>
                <Button size="icon" variant="outline" className="self-center ml-2" onClick={() => joinCall("user", null, null, toChatUser, directMessageId)}>
                    <PhoneCall />
                </Button>
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
            <ScrollArea className={`h-[calc(100vh-125px)] ${messages.length <= 0 ? "flex w-full" : ""}`}>
                {searchedMessages.length > 0 && searchedMessages.map(message => (
                    <DirectMessage message={message} dmID={directMessageId} key={message.id} />
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
                <UploadDMFile dmID={directMessageId} receiverID={toChatUser.id} />
                <Input
                    className="placeholder:italic bg-darkerbackground w-full"
                    placeholder="Send a message"
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
                            <SmilePlus size={24}  />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                        <Picker onEmojiSelect={addEmoji} theme={theme}/>
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
