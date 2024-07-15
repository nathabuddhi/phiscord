import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Loading() {
    const tips = [
        "Shoutout to Inside of Motion for the loading gif!",
        "LC118 made this.",
        "If you think you're a good dev, you should meet LC118 first.",
        "LC118 is the best dev.",
        "Shoutout to Inside of Motion for the loading gif!",
        "If the loading is taking too long, blame your device, not the app.",
        "Idk what else to put here",
        "Shoutout to Inside of Motion for the loading gif!",
      ];
    
    const [randomTip, setRandomTip] = useState('');

    useEffect(() => {
        const selectedTip = tips[Math.floor(Math.random() * tips.length)];
        setRandomTip(selectedTip);
    }, []);
    return (
        <>
            <Head>
                <title>Loading - PHiscord</title>
            </Head>
            <div className="flex flex-col justify-center items-center h-[calc(100vh-40px)] bg-[#5165f6]">
                <div className="w-1/2 max-w-sm p-8 rounded-lg border-0">
                    <img src="/gifs/loading_logo.gif" alt="Loading" className="w-full h-auto border-0" />
                    <p className="text-2xl text-white text-center mt-4"></p>
                    <p className="text-base text-gray-300 text-center mt-4">{randomTip}</p>
                </div>
            </div>
        </>
    );
};
