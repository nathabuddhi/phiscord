import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import OverlaySettings from '@/components/settings/overlay-settings';
import PrivacySettings from '@/components/settings/privacy-settings';
import PasswordSettings from '@/components/settings/password-settings';
import GeneralSettings from '@/components/settings/general-settings';

export default function SettingsComponent({ userDetails }) {
    return (
        <>
            <Dialog>
                <DialogTrigger>
                    <Button variant="ghost" size='icon' className='w-8 h-8'>
                        <Settings />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                        <DialogDescription>
                            View and change your settings here.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="password">Password</TabsTrigger>
                            <TabsTrigger value="privacy">Privacy</TabsTrigger>
                            <TabsTrigger value="overlay">Others</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <GeneralSettings userDetails={userDetails} />
                        </TabsContent>
                        <TabsContent value="password">
                            <PasswordSettings userDetails={userDetails} />
                        </TabsContent>
                        <TabsContent value="privacy">
                            <PrivacySettings userDetails={userDetails} />
                        </TabsContent>
                        <TabsContent value="overlay">
                            <OverlaySettings userDetails={userDetails} />
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    )
}
