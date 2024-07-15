import { Dialog, DialogContent,DialogTrigger } from "@/components/ui/dialog"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from '@/components/ui/use-toast';
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react"
import { auth, db } from "@/components/firebase";

const nicknameSchema = z.object({
    nickname: z.string().min(1, "Nickname cannot be empty.").min(3, "Nickname must be at least 3 characters long.")
})

export default function ChangeNickname({ serverId }) {
    const userId = auth.currentUser.uid;
    
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [currNickname, setCurrNickname] = useState('');

    useEffect(() => {
        const nicknameDocRef = doc(db, `servers/${serverId}/nicknames`, userId);

        const unsubscribe = onSnapshot(nicknameDocRef, (doc) => {
            if (doc.exists()) {
                setCurrNickname(doc.data().nickname);
            }
        });

        return () => unsubscribe();
        
    })

    const nicknameForm = useForm<z.infer<typeof nicknameSchema>>({
        resolver: zodResolver(nicknameSchema),
        defaultValues: {
            nickname: currNickname ? currNickname : ''
        },
    })

    async function onNicknameSubmit(data: z.infer<typeof nicknameSchema>) {
        try {
            const nicknameDocRef = doc(db, `servers/${serverId}/nicknames`, userId);

            const docSnapshot = await getDoc(nicknameDocRef);
            if (docSnapshot.exists()) {
                await setDoc(nicknameDocRef, {
                    id: userId,
                    nickname: data.nickname
                });
            } else {
                await setDoc(nicknameDocRef, {
                    id: userId,
                    nickname: data.nickname
                });
            }
    
            toast({
                title: "Success!",
                description: "Your nickname has been updated.",
            });
            setIsOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Your nickname wasn't updated: " + error.message,
            });
        }
    }
    

    return (
        <>
            <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
                <DialogTrigger>
                    <Button variant="ghost" className="my-1 w-full">Change Nickname</Button>
                </DialogTrigger>
                <DialogContent>
                    <Card>
                        <CardHeader>
                            <CardTitle>General</CardTitle>
                            <CardDescription>
                                Good ol' general settings. Customize your profile here!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                        <Form {...nicknameForm}>
                                <form onSubmit={nicknameForm.handleSubmit(onNicknameSubmit)} className="w-full space-y-3">
                                    <div className="space-y-3">
                                        <FormField control={nicknameForm.control} name="nickname"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nickname</FormLabel>
                                                <FormControl>
                                                    <Input {...field}  />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    </div>
                                    <Button type="submit">Save changes</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>
        </>
    )
}