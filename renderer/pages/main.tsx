import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/site-header";

export default function MainPage() {
    return (
        <>
            <Head>
                <title>Main - PHiscord</title>
            </Head>
            <SiteHeader />
            <Link href="/login">
                <Button>Login Page</Button>
            </Link>
            <Link href="/register">
                <Button>Register Page</Button>
            </Link>
            <Link href="/home">
                <Button>Home Page</Button>
            </Link>
            <Link href="/settings">
                <Button>Settings Page</Button>
            </Link>
        </>
    );
}
