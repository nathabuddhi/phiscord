import React from 'react';
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import Head from "next/head";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import guestMiddleware from '@/components/middleware/guest-middleware';
import { auth, db } from "@/components/firebase";

const checkAge = (date) => {
    const today = new Date();
    const birthDate = new Date(date);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    const dayDifference = today.getDate() - birthDate.getDate();

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        return age - 1;
    }
    return age;
};

const formSchema = z.object({
    username: z.string().min(1, "Username is required.").min(3, "Username must be at least 3 characters."),
    email: z.string().min(1, "Email is required.").email("Invalid email address!"),
    password: z.string().min(1, "Password is required.").min(8, "Password must be at least 8 characters."),
    date: z.date({
        required_error: "Date of birth is required.",
    }).refine(date => checkAge(date) >= 1, { //ini cuma >= 1 soalnya kalo >= 13 capek ngeceknya hehe
        message: "You must be at least 13 years old.",
    }),
});

function RegisterPage() {
    const { toast } = useToast();

    const checkUsername = async (username) => {
        const usersCollectionRef = collection(db, "users");
        const docRef = query(usersCollectionRef, where("username", "==", username));
    
        const querySnapshot = await getDocs(docRef);
        if (querySnapshot.empty)
            return true;
        else
            return false;
    }
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        username: "",
        email: "",
        password: ""
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if(checkUsername(values.username)) {
                toast({
                    variant: "destructive",
                    title: "Username taken!",
                    description: "The username you typed is already taken. Please try another username."
                });
                form.resetField('username');
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;
            if (user) {
                await setDoc(doc(db, "users", user.uid), {
                    id: user.uid,
                    email: user.email,
                    username: values.username,
                    displayname: values.username,
                    dob: values.date,
                    status: "available",
                    randomMessage: true,
                    randomRequest: false,
                    randomFriend: true,
                    randomCall: false,
                    avatarname: values.username.slice(0, 2).toUpperCase(),
                    friends: [], 
                    blocked: [],
                    messages: []
                });
                toast({
                    title: "Success!",
                    description: "Your account has been created. If you are not redirected, please click the button below.",
                    action: <ToastAction altText='Login'><Link href="/home">Click here</Link></ToastAction>,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed registering: " + error.message,
            });
        }
    }

    return (
        <>
            <Head>
                <title>Register - PHiscord</title>
            </Head>
            <SiteHeader />
            <div className="flex flex-column justify-center items-center h-[90vh]">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-darkerbackground rounded-[10px] justify-center items-center w-[520px] p-[25px] px-[40px] shadow-2xl">
                    <p className="text-3xl text-center font-bold text-foreground">Create Account</p>
                    <FormField control={form.control} name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="example@phiscord.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date of birth</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="exampleusername123" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div>
                    <Button type="submit" className="w-full">Create Account</Button>
                    <p className="text-xs text-darkerforeground ml-[1px]">
                        By creating an account, you agree to PHiscord's <a className="text-xs text-primary hover:underline" href="https://discord.com/terms" target='_blank'>Terms of Service</a> and <a className="text-xs text-primary hover:underline" href="https://discord.com/privacy" target='_blank'>Privacy Policy</a>.
                    </p>
                    <Button variant="link" className="ml-[3px] mt-[10px] p-0"><Link href="/login">Already have an account? Login here</Link></Button>
                    </div>
                </form>
                </Form>
            </div>
        </>
    );
}

export default guestMiddleware(RegisterPage);