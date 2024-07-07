import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import GeneralServerSettings from "@/components/secondary/serversettings/general-server-settings";
import { getAuth } from "firebase/auth";
import SettingMemberList from "@/components/secondary/serversettings/setting-member-list";
import BanList from "@/components/secondary/serversettings/ban-list";
import DeleteServer from "@/components/secondary/serversettings/delete-server";

export default function ServerSettings ({ server, changeViewType }) {
    const [isOpen, setIsOpen] = useState(false);

    const user = getAuth().currentUser;

    const toggleOpen = () => {
        setIsOpen(prevState => !prevState);
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={toggleOpen}>
                <DialogTrigger>
                    <Button variant="ghost" className="my-1 w-full">Server Settings</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Server Settings</DialogTitle>
                        <DialogDescription>
                            View and change your server settings here.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className={user.uid == server.ownerId ? "grid w-full grid-cols-4" : "grid w-full grid-cols-2"}>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="members">Members</TabsTrigger>
                            {user.uid === server.ownerId && <TabsTrigger value="bans">Bans</TabsTrigger>}
                            {user.uid === server.ownerId && <TabsTrigger value="delete">Delete Server</TabsTrigger>}
                        </TabsList>
                        <TabsContent value="general">
                            <GeneralServerSettings server={server} toggleOpen={toggleOpen} />
                        </TabsContent>
                        <TabsContent value="members">
                            <SettingMemberList server={server} />
                        </TabsContent>
                        {
                            user.uid === server.ownerId &&
                            <TabsContent value="bans">
                                <BanList server={server} />
                            </TabsContent>
                        }
                        {
                            user.uid === server.ownerId &&
                            <TabsContent value="delete">
                                <DeleteServer server={server} changeViewType={changeViewType} />
                            </TabsContent>
                        }
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    )
}