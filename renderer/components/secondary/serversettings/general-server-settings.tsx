import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from '@/components/ui/use-toast';
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { storage } from "@/components/firebase";

const generalServerSchema = z.object({
    name: z.string().min(3, "Server is required and must be at least 3 characters long."),
    icon: z.any().optional(),
})

export default function GeneralServerSettings({ server, toggleOpen }) {
    const { toast } = useToast();

    const generalServerForm = useForm<z.infer<typeof generalServerSchema>>({
        resolver: zodResolver(generalServerSchema),
        defaultValues: {
            name: server.name,
            icon: null,
        },
    })

    async function onGeneralSubmit(data: z.infer<typeof generalServerSchema>) {
        const firestore = getFirestore();
        const serverDocRef = doc(firestore, `servers/${server.id}`);

        try {
            let serverIconUrl = server.icon;
            if (data.icon && data.icon.length > 0) {
                const serverIconFile = data.icon[0];
                const storageRef = ref(storage, `server_icons/${server.id}_icon`);
                await uploadBytes(storageRef, serverIconFile);
                serverIconUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(serverDocRef, {
                name: data.name,
                icon: serverIconUrl,
            });
            toggleOpen();
            toast({
                title: "Success!",
                description: "Server details have been updated.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to update server: " + error.message,
            });
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>
                        General Server Settings, change your server information here.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                <Form {...generalServerForm}>
                        <form onSubmit={generalServerForm.handleSubmit(onGeneralSubmit)} className="w-full space-y-3">
                            <div className="space-y-3">
                                <FormField control={generalServerForm.control} name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Server name</FormLabel>
                                        <FormControl>
                                            <Input {...field}  />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField control={generalServerForm.control} name="icon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Server Icon</FormLabel>
                                        <FormDescription>If you don't upload anything, the old server icon will still be used.</FormDescription>
                                        <FormControl>
                                            <Input type="file" onChange={(e) => field.onChange(e.target.files)} className="hover:bg-serverlistbackground hover:cursor-pointer" />
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
        </>
    )
}