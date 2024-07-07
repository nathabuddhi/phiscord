import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PhoneMissed, Signal, Video, VideoOff, Eye, EyeOff } from "lucide-react"

export default function CallInfo({ isVideoOn, toggleVideo, isViewingCall, toggleIsViewingCall, type, server, channel, user, leaveCall }) {
    const getCallDetails = () => {
        var details;
        if(type == "channel" && server && channel)
            details = channel.name + " / " + server.name;
        else if(type == "user" && user)
            details = user.username;
        else
            details = "Loading Call Details..."
        if(details.length > 23)
            return details.substring(0, 20) + "...";
        return details;
    }
    return (
        <>
            <div className="w-[200px] h-[100px] bg-barbackground flex flex-col p-2">
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex flex-row">
                            <Signal color="green" />
                            <p className="text-sm ml-2">Voice Connected</p>
                        </div>
                        <p className="text-xs">{getCallDetails()}</p>
                    </div>
                    <div className="flex flex-col">
                        <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => leaveCall()}>
                            <PhoneMissed width={12} height={12} />
                        </Button>
                    </div>
                </div>
                <div className="flex flex-row justify-evenly mt-2">
                    {isVideoOn ?
                        <Button onClick={() => toggleVideo()} className="w-20">
                            <Video width={20} height={20} />
                        </Button>
                        :
                        <Button variant="outline" onClick={() => toggleVideo()} className="w-20">
                            <VideoOff width={20} height={20} />
                        </Button>
                    }
                    {isViewingCall ? 
                        <Button onClick={() => toggleIsViewingCall()} className="w-20">
                            <Eye width={20} height={20} />
                        </Button>
                        :
                        <Button variant="outline" onClick={() => toggleIsViewingCall()} className="w-20">
                            <EyeOff width={20} height={20} />
                        </Button>
                    }
                </div>
            </div>
        </>
    )
}