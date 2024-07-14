import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogFooter, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { query, getFirestore, collection, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

export default function SearchConversation({ changeUserToChat, userDetails }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const firestore = getFirestore();

    const searchConvo = async (searchQuery) => {
        const dmQuery = query(
            collection(firestore, "directmessages"),
            where("participants", "array-contains", userDetails.id)
        );
    
        const dmSnapshot = await getDocs(dmQuery);
        const matchingMessages = [];
    
        if (!dmSnapshot.empty) {
            const searchPromises = [];
    
            dmSnapshot.forEach((dm) => {
                const messagesRef = collection(firestore, "directmessages", dm.id, "messages");
    
                searchPromises.push(getDocs(messagesRef).then((messagesSnapshot) => {
                    messagesSnapshot.forEach((message) => {
                        const messageData = message.data();
                        if (messageData.content.includes(searchQuery)) {
                            matchingMessages.push({
                                ...messageData,
                                senderId: messageData.author
                            });
                        }
                    });
                }));
            });
    
            await Promise.all(searchPromises);
        }
    
        return matchingMessages;
    };

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }
        
        const fetchSearchResults = async () => {
            const results = await searchConvo(searchQuery);
            setSearchResults(results);
        };

        fetchSearchResults();
    }, [searchQuery]);

    return (
        <>
            <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(!isDialogOpen)}>
                <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full my-2">Search Conversation</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Search Conversation</DialogTitle>
                    </DialogHeader>
                    <Input
                        className='bg-darkerbackground'
                        onChange={(e) => setSearchQuery(e.target.value)}
                        value={searchQuery}
                        placeholder="Search..."
                    />
                    <ScrollArea className='max-h-96'>
                        {searchResults.length > 0 && searchResults.map((result) => (
                            <React.Fragment key={result.id}>
                                <div key={result.id} className='mx-4 flex justify-between items-center mt-2'>
                                    <div className='w-auto overflow-auto'>
                                        <p >{result.content.slice(0, 45) + '...'}</p>
                                    </div>
                                    <Button onClick={() => changeUserToChat(result.userId)}>Jump</Button>
                                </div>
                                <Separator className='bg-darkerbackground mt-2' />
                            </React.Fragment>
                        ))}
                        {searchQuery.trim() === '' && <p>You're not gonna find any conversations if you don't type anything</p>}
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose>
                            <Button variant='logout'>
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
