import React, { useEffect } from 'react';
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import Head from "next/head";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "@/components/firebase";
import { useToast } from "@/components/ui/use-toast";
import guestMiddleware from '@/components/middleware/guest-middleware';

const formSchema = z.object({
    email: z.string().min(1, "Email is required."),
    password: z.string().min(1, "Password is required."),
})

function LoginPage() {
    const { toast } = useToast()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: ""
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password)
            toast({
                title: "Successfully logged in!",
                description: "Redirecting to home page...",
              })
            window.location.href = "/home"
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to log in: " + error.message,
              })
        }
    }

    useEffect(() => {
        const timeout = setTimeout(() => {
            const toastMessage = sessionStorage.getItem("toastMessage");
            if (toastMessage) {
                const { variant, title, description } = JSON.parse(toastMessage);
                toast({ variant, title, description });
                sessionStorage.removeItem("toastMessage");
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [toast]);

    return (
        <>
            <Head>
                <title>Login - PHiscord</title>
            </Head>
            <SiteHeader />
            <div className="flex flex-column justify-center items-center h-[90vh]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-darkerbackground rounded-[10px] justify-center items-center w-[520px] p-[25px] px-[40px] shadow-2xl">
                        <p className="text-3xl text-center font-bold text-foreground">Welcome back!</p>
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
                        <FormField control={form.control} name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type='password' placeholder="Enter your password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                            <Button type="submit" className="w-full">Login</Button>
                            <Button variant="link" className="ml-[3px] p-0"><Link href="/register">Don't have an account? Create one here</Link></Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    )
}

export default guestMiddleware(LoginPage);