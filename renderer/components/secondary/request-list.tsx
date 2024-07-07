import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import RequestInfo from "@/components/secondary/tertiary/request-info";

export default function RequestList() {
    const [outgoingRequestIsOpen, setOutgoingRequestIsOpen] = useState(true);
    const [incomingRequestIsOpen, setIncomingRequestIsOpen] = useState(true);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const [declinedRequests, setDeclinedRequests] = useState(0)

    const toggleOutgoing = () => {
        setOutgoingRequestIsOpen(prevState => !prevState);
    };

    const toggleIncoming = () => {
        setIncomingRequestIsOpen(prevState => !prevState);
    };

    const countDeclinedRequests = () => {
        incomingRequests.map(request => {
            if (request.status === "declined") {
                setDeclinedRequests(declinedRequests + 1);
            }
        })
    }

    useEffect(() => {
        if (user) {
            const firestore = getFirestore();
            const friendRequestsCollection = collection(firestore, "friendrequests");

            const incomingQuery = query(friendRequestsCollection, where("receiverId", "==", user.uid));
            const outgoingQuery = query(friendRequestsCollection, where("senderId", "==", user.uid));

            const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
                const incomingList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setIncomingRequests(incomingList);
                countDeclinedRequests();
            });

            const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
                const outgoingList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOutgoingRequests(outgoingList);
            });

            return () => {
                unsubscribeIncoming();
                unsubscribeOutgoing();
            };
        }
    }, [user]);

    return (
        <>
            <ScrollArea className="h-[calc(100vh-165px)] w-full bg-darkerbackground px-4 flex flex-col">
                <Collapsible className="mb-2" open={incomingRequestIsOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex flex-row justify-normal w-full" onClick={toggleIncoming}>
                            {incomingRequestIsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <div className="ml-1">Incoming Requests</div>
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        {incomingRequests.length > declinedRequests && incomingRequests.map(request => (
                            <RequestInfo key={request.id} request={request} type="incoming" />
                        ))}
                        {incomingRequests.length <= declinedRequests && <div className="text-left text-gray-500">&emsp;&emsp;No incoming requests</div>}
                    </CollapsibleContent>
                </Collapsible>
                <Collapsible open={outgoingRequestIsOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex flex-row justify-normal w-full" onClick={toggleOutgoing}>
                            {outgoingRequestIsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <div className="ml-1">Outgoing Requests</div>
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        {outgoingRequests.length > 0 && outgoingRequests.map(request => (
                            <RequestInfo key={request.id} request={request} type="outgoing" />
                        ))}
                        {outgoingRequests.length === 0 && <div className="text-left text-gray-500">&emsp;&emsp;No incoming requests</div>}
                    </CollapsibleContent>
                </Collapsible>
            </ScrollArea>
        </>
    )
}