import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { doc, getFirestore, setDoc } from "firebase/firestore"

const overlayFormSchema = z.object({
    enabled: z.boolean().optional(),
    fontsize: z.string().optional()
})

export default function OverlaySettings({ userDetails }) {
    const firestore = getFirestore();
    const { toast } = useToast();

    const overlayForm = useForm<z.infer<typeof overlayFormSchema>>({
        resolver: zodResolver(overlayFormSchema),
        defaultValues: {
            enabled: false,
            fontsize: userDetails.font ? userDetails.font : 'base'
        },
    })

    async function onOverlaySubmit(data: z.infer<typeof overlayFormSchema>) {
        try {
            const userDocRef = doc(firestore, "users", userDetails.id);
            await setDoc(userDocRef, {
                font: data.fontsize
            }, { merge: true });
            toast({
                title: "Success!",
                description: "Your settings have been updated.",
            })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Your settings weren't updated: " + error.message,
            })
        }
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Other</CardTitle>
                <CardDescription>
                    Other settings such as overlays and font size.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Form {...overlayForm}>
                    <form onSubmit={overlayForm.handleSubmit(onOverlaySubmit)} className="w-full space-y-6">
                        <div>
                            <div className="space-y-3">
                                <FormField
                                control={overlayForm.control}
                                name="enabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Enable overlays</FormLabel>
                                            <FormDescription className='ml-[3px] pr-[5px] text-gray-500 dark:text-gray-400'>
                                                Sorry, but overlays are an upcoming feature. LC118 is working hard to make overlays a reality, stay tuned!
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                                />
                            </div>
                            <div className="space-y-3">
                                <FormField
                                control={overlayForm.control}
                                name="fontsize"
                                render={({ field }) => (
                                    <FormItem className="space-y-3 mt-4">
                                        <FormLabel className="text-lg p-0 m-0">Font Size</FormLabel>
                                        <FormDescription className='pr-[5px] text-foreground'>
                                            The size of the text in all your messages.
                                        </FormDescription>
                                        <FormControl>
                                            <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="sm" />
                                                    </FormControl>
                                                    <FormLabel>
                                                        Smaller
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="base" />
                                                    </FormControl>
                                                    <FormLabel>
                                                        Normal
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="lg" />
                                                    </FormControl>
                                                    <FormLabel>Bigger</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                    </FormItem>
                                )}
                                />
                            </div>
                        </div>
                        <Button>Save changes</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
        </>
    )
}