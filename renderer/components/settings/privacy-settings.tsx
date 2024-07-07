import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription,  CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/components/firebase";
import { useToast } from "@/components/ui/use-toast"

const privacyFormSchema = z.object({
    random_message: z.boolean().optional(),
    random_request: z.boolean().optional(),
    random_friend: z.boolean().optional(),
    random_call: z.boolean().optional()
})

export default function PrivacySettings({ userDetails }) {
    const { toast } = useToast()

    const privacyForm = useForm<z.infer<typeof privacyFormSchema>>({
        resolver: zodResolver(privacyFormSchema),
        defaultValues: {
            random_message: userDetails.randomMessage,
            random_request: userDetails.randomRequest,
            random_friend: userDetails.randomFriend,
            random_call: userDetails.randomCall,
        },
    })

    async function onPrivacySubmit(data: z.infer<typeof privacyFormSchema>) {
        try {
            const userDocRef = doc(db, "users", userDetails.id);
            await setDoc(userDocRef, {
                randomMessage: data.random_message,
                randomRequest: data.random_request,
                randomFriend: data.random_friend,
                randomCall: data.random_call,
            }, { merge: true });
            toast({
                title: "Success!",
                description: "Your privacy settings have been updated.",
            })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Your privacy settings weren't updated: " + error.message,
            })
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Privacy</CardTitle>
                    <CardDescription>
                        Privacy settings include settings like whether or not you want to receive friend requests or messages from unknown people.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Form {...privacyForm}>
                        <form onSubmit={privacyForm.handleSubmit(onPrivacySubmit)} className="w-full space-y-6">
                            <div>
                                <div className="space-y-4">
                                    <FormField
                                    control={privacyForm.control}
                                    name="random_message"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Stranger messages</FormLabel>
                                            <FormDescription className='ml-[3px] pr-[5px]'>
                                                Receive direct messages from users you haven't added.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={privacyForm.control}
                                    name="random_request"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Message requests</FormLabel>
                                            <FormDescription className='ml-[3px] pr-[5px]'>
                                                Receive message requests from users you haven't added. This feature is UPCOMING.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch disabled
                                            checked={false}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={privacyForm.control}
                                    name="random_friend"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Friend requests</FormLabel>
                                            <FormDescription className='ml-[3px] pr-[5px]'>
                                                Receive friend requests from users you haven't added.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={privacyForm.control}
                                    name="random_call"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Stranger calls</FormLabel>
                                            <FormDescription className='ml-[3px] pr-[5px]'>
                                                Receive call requests from users you haven't added. <i>We recommend turning this off.</i>
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                    />
                                </div>
                            </div>
                            <Button type="submit">Save changes</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    )
}
