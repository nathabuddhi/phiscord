import React from "react";
import type { AppProps } from "next/app";

import "../styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import TitleBar from "@/components/title-bar";

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            <TitleBar />
            <Component {...pageProps} />
            <Toaster />
        </ThemeProvider>
    );
}

export default MyApp;
