import { Hash, SmilePlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import Message from "@/components/secondary/messaging/message";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuth } from "firebase/auth";
import UploadFile from "@/components/secondary/messaging/upload-file";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Picker from '@emoji-mart/react';
import { useTheme } from "next-themes";
import Filter from 'bad-words';

export default function ChatBox({ channel, server }) {
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const firestore = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    const { theme } = useTheme();
    const [searchMessage, setSearchMessage] = useState("");

    const filter = new Filter();

    const chatBoxBottom = useRef(null)

    useEffect(() => {
        chatBoxBottom.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages]);

    useEffect(() => {
        if (!server || !channel) return;
        const messagesRef = collection(firestore, `servers/${server.id}/textchannels/${channel.id}/messages`);
        const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesList);
        }, (error) => {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "We couldn't fetch messages for this channel. Please try again. Error: " + error.message
            });
        });

        return () => unsubscribe();
    }, [channel, server]);

    const sendMessage = async (content) => {
        if (!content.trim()) return;

        if(filter.isProfane(content)) {
            toast({
                variant: "destructive",
                title: "Profanity detected.",
                description: "Please refrain from using profanity in your messages. We want to keep PHiscord a safe and friendly place for everyone."
            })
            return;
        } 

        try {
            const messagesRef = collection(firestore, `servers/${server.id}/textchannels/${channel.id}/messages`);
            await addDoc(messagesRef, {
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

    const searchedMessages = messages.filter(message => 
        message.content.toLowerCase().includes(searchMessage.toLowerCase())
    );

    return (
        <div className="w-[calc(100vw-520px)] flex flex-col bg-background border-r-4 border-darkerbackground">
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
            <ScrollArea className={`h-[calc(100vh-125px)] ${messages.length <= 0 ? "flex w-full" : ""}`}>
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
                            <SmilePlus size={24}  />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                        <Picker onEmojiSelect={addEmoji} theme={theme}/>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
