import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { auth, db, storage } from "@/components/firebase";

export default function UploadFile({ server, channel }) {
    const { toast } = useToast();
    const user = auth.currentUser;
    const [file, setFile] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const changeFile = (e) => {
        setFile(e.target.files[0]);
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
        })

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
