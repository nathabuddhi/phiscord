import { Button } from "@/components/ui/button";
import { Contact } from 'lucide-react';

export default function FriendButton({ changeViewType, changeToFriendView }) {
    return (
        <>
            <Button variant="ghost" className="p-[4px] rounded-full" size="icon" onClick={() => {changeViewType(2); changeToFriendView()}}> 
                <Contact size={24} />
            </Button>
        </>
    )
}