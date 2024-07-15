import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from '@/components/ui/use-toast';
import { doc, deleteDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { auth, db } from "@/components/firebase";

const deleteServerSchema = z.object({
    name: z.string().min(1, "Server name is required."),
    password: z.string().min(1, "Owner password is required.")
})

export default function DeleteServer({ server, changeViewType }) {
    const { toast } = useToast();

    const deleteServerForm = useForm<z.infer<typeof deleteServerSchema>>({
        resolver: zodResolver(deleteServerSchema),
        defaultValues: {
            name: "",
            password: "",
        },
    })

    async function onDeleteSubmit(data: z.infer<typeof deleteServerSchema>) {
        const serverDocRef = doc(db, `servers/${server.id}`);

        if (data.name !== server.name) {
            toast({
                variant: "destructive",
                title: "Error!",
                description: "Server name does not match.",
            });
            return;
        }

        const currUser = auth.currentUser;
        const credential = EmailAuthProvider.credential(
            currUser.email!,
            data.password
        );
        try {
            await reauthenticateWithCredential(currUser, credential);
            await deleteDoc(serverDocRef);
            toast({
                title: "Success!",
                description: "Server has been deleted.",
            });
            changeViewType(2);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to delete server: " + error.message,
            });
        }
    }

    return(
        <>
            <Card>
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>
                        General Server Settings, change your server information here.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                <Form {...deleteServerForm}>
                        <form onSubmit={deleteServerForm.handleSubmit(onDeleteSubmit)} className="w-full space-y-3">
                            <div className="space-y-3">
                                <FormField control={deleteServerForm.control} name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Server Name</FormLabel>
                                        <FormDescription>Input your server name before deleting it.</FormDescription>
                                        <FormControl>
                                            <Input {...field}  />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField control={deleteServerForm.control} name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Owner Password</FormLabel>
                                        <FormDescription>Confirm your identity as the server owner.</FormDescription>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <Button variant="destructive" type="submit">Delete Server</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    )
}