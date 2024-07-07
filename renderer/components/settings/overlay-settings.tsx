import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

const overlayFormSchema = z.object({
    enabled: z.boolean().optional()
})

export default function OverlaySettings({ userDetails }) {
    const overlayForm = useForm<z.infer<typeof overlayFormSchema>>({
        resolver: zodResolver(overlayFormSchema),
        defaultValues: {
            enabled: false
        },
    })

    function onOverlaySubmit(data: z.infer<typeof overlayFormSchema>) {
        //update firestore data
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Overlay</CardTitle>
                <CardDescription>
                    Overlays are a great way to know what's happening in your call while still in another app.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Form {...overlayForm}>
                    <form onSubmit={overlayForm.handleSubmit(onOverlaySubmit)} className="w-full space-y-6">
                        <div>
                            <div className="space-y-4">
                                <FormField
                                control={overlayForm.control}
                                name="enabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Enable overlays</FormLabel>
                                        <FormDescription className='ml-[3px] pr-[5px] text-gray-400'>
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
                        </div>
                        <Button disabled>Save changes</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
        </>
    )
}