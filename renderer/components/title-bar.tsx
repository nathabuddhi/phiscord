import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Maximize, Minimize, X } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/components/firebase';

export default function TitleBar() {

    const [isMaximized, setIsMaximized] = useState(false);

    const toggleMaximize = () => {
        if(isMaximized) {
            window.ipc.send('unmaximize-window', null);
        } else {
            window.ipc.send('maximize-window', null);
        }
        setIsMaximized((prevState) => !prevState);
    }

    const minimizeWindow = () => {
        window.ipc.send('minimize-window', null);
    }

    const closeWindow = async () => {
        const tempUser = auth.currentUser;
        if(tempUser) {
            const userDocRef = doc(db, "users", tempUser.uid);
            await setDoc(userDocRef, {
                isOnline: false
            }, { merge: true });
        }
        window.ipc.send('close-window', null);
    }

    useEffect(() => {
        const removeMaximizedListener = window.ipc.on('window-maximized', () => {
            setIsMaximized(true);
        });

        const removeUnMaximizedListener = window.ipc.on('window-unmaximized', () => {
            setIsMaximized(false);
        });

        return () => {
            removeMaximizedListener();
            removeUnMaximizedListener();
        };
    }, [])

    return (
        <div className="title-bar flex flex-row bg-serverlistbackground justify-between items-center px-3 h-[40px]">
            <div className="text-[#5165f6] font-extrabold">PHiscord</div>
            <div className="title-bar-controls flex">
                <Button size='icon' variant='ghost' className='w-8 h-8' onClick={() => minimizeWindow()}>
                    <Minus size={16} />
                </Button>
                <Button size='icon' variant='ghost' className='w-8 h-8' onClick={() => toggleMaximize()}>
                    {isMaximized ? <Minimize size={18} /> : <Maximize size={18} />}
                </Button>
                <Button size='icon' variant='ghost' className='w-8 h-8' onClick={() => closeWindow()}>
                    <X size={18} />
                </Button>
            </div>
        </div>
    )
}