import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "@/components/firebase";
import Link from "next/link";

const generalFormSchema = z.object({
    username: z.string().min(1, "Username is required."),
    displayname: z.string().optional(),
    avatarname: z.string().length(2, "Avatar name must be 2 characters long."),
})

export default function GeneralSettings({ userDetails }) {
    const { toast } = useToast();

    async function logout() {
        try {
            sessionStorage.setItem('logout', 'true');
            await auth.signOut();
            window.location.href = "/login";
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed logging out!",
                description: error.message,
                action: <ToastAction altText='Retry'><Link href="/login">Retry</Link></ToastAction>,
            });
        } finally {
            sessionStorage.removeItem('isLoggingOut');
        }
    }

    const generalForm = useForm<z.infer<typeof generalFormSchema>>({
        resolver: zodResolver(generalFormSchema),
        defaultValues: {
            username: userDetails.username,
            displayname: userDetails.displayname,
            avatarname: userDetails.avatarname
        },
    })

    const usernameTaken = async (username) => {
        const usersCollectionRef = collection(db, "users");
        const usernameQuery = query(usersCollectionRef, where("username", "==", username));
        const querySnapshot = await getDocs(usernameQuery);
        if(!querySnapshot.empty && querySnapshot.docs[0].id !== userDetails.id) {
            return true;
        } else {
            return false;
        }
    };

    async function onGeneralSubmit(data: z.infer<typeof generalFormSchema>) {
        if(await usernameTaken(data.username)) {
            toast({
                variant: "destructive",
                title: "Username taken!",
                description: "The username you typed is already taken. Please try another username."
            });
            generalForm.resetField('username');
            return;
        }

        try {
            const userDocRef = doc(db, "users", userDetails.id);
            await setDoc(userDocRef, {
                username: data.username,
                displayname: data.displayname,
                avatarname: data.avatarname.toUpperCase()
            }, { merge: true });
            toast({
                title: "Success!",
                description: "Your profile has been updated.",
            })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Your profile wasn't updated: " + error.message,
            })
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>
                        Good ol' general settings. Customize your profile here!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                <Form {...generalForm}>
                        <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="w-full space-y-3">
                            <div className="space-y-3">
                                <FormField control={generalForm.control} name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input {...field}  />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField control={generalForm.control} name="displayname"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField control={generalForm.control} name="avatarname"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Avatar</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                <CardFooter>
                    <Button variant='logout' onClick={logout}>Logout</Button>
                </CardFooter>
            </Card>
        </>
    )
}