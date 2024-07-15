import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { auth, db, storage } from "@/components/firebase";

export default function UploadFile({ dmID, receiverID }) {
    const { toast } = useToast();
    const user = auth.currentUser;
    const [file, setFile] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currUser, setCurrUser] = useState(null);
    const [toChatUser, setToChatUser] = useState(null);

    const changeFile = (e) => {
        setFile(e.target.files[0]);
    };

    useEffect(() => {
        const tempUser = auth.currentUser;

        const userDocRef = doc(db, "users", tempUser.uid);
        const toChatDocRef = doc(db, "users", receiverID);

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
        });

        const unsubscribeUserToChat = onSnapshot(toChatDocRef, (snapshot) => {
            if (snapshot.exists()) {
                setToChatUser(snapshot.data());
            }
        }, (error) => {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to fetch user data: " + error.message
            });
        });

        return () => {
            unsubscribeUser();
            unsubscribeUserToChat();
        };
    }, [receiverID]);

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
            const receiverDocRef = doc(db, "users", toChatUser.id);

            await updateDoc(receiverDocRef, {
                messages: arrayUnion(currUser.id)
            });
        }

        toast({
            title: "Uploading file.",
            description: "Please wait while we upload your file.",
        })

        const fileType = file.type.startsWith("image/") ? "image" : "file";
        const storageRef = ref(storage, `uploads/${dmID}/${file.name}`);
        try {
            const addNotificationDocRef = collection(db, `users/${toChatUser.id}/toastNotifications`);
            await addDoc(addNotificationDocRef, {
                title: "New Message",
                description: `${currUser.username} sent you a file`,
                senderId: currUser.id,
                duration: 3000,
            });
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            const messagesRef = collection(db, `directmessages/${dmID}/messages`);
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

            const notifQuery = collection(db, `users/${receiverID}/notifications`);
            await addDoc(notifQuery, {
                content: "Sent you a file.",
                from: auth.currentUser.uid,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh. Something went wrong.",
                description: "Failed to upload file: " + error.message,
            });
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setDialogOpen(true)}>
                    <FileUp className="w-6 h-6" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload a File</DialogTitle>
                </DialogHeader>
                <Input 
                    type="file" 
                    className="bg-darkerbackground hover:cursor-pointer" 
                    onChange={changeFile} 
                />
                <Button onClick={uploadFile} className="mt-2">
                    Upload
                </Button>
            </DialogContent>
        </Dialog>
    );
}
