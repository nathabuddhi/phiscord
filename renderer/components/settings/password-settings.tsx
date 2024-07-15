import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useToast } from '@/components/ui/use-toast';
import { auth } from "@/components/firebase";

const passwordFormSchema = z.object({
    current: z.string().min(1, "Current password is required!"),
    new: z.string().min(8, "New password must be at least 8 characters long."),
    confirm: z.string().min(1, "Please confirm your new password!"),
}).superRefine((data, ctx) => {
    if (data.new !== data.confirm) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Passwords do not match!",
            path: ["confirm"],
        });
    }
});

export default function PasswordSettings({ userDetails }) {
    const { toast } = useToast();

    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            current: "",
            new: "",
            confirm: ""
        },
    })

    async function onPasswordSubmit(data: z.infer<typeof passwordFormSchema>) {
        const user = auth.currentUser;
    
        if (user) {
            const credential = EmailAuthProvider.credential(
                user.email!,
                data.current
            );
    
            try {
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, data.new);
                toast({
                    title: "Success!",
                    description: "Your password has been updated successfully.",
                })
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description: "Your password wasn't updated: " + error.message,
                })
            }
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                        You can change your password here. Make sure no one's looking while you change it!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="w-full space-y-3">
                            <div className="space-y-3">
                                <FormField control={passwordForm.control} name="current"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field}  />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField control={passwordForm.control} name="new"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField control={passwordForm.control} name="confirm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm new password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <Button type="submit">Save password</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    )
}