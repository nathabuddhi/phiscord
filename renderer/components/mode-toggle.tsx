import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        if (theme === "light") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    };

    return (
        <Button onClick={toggleTheme} variant="outline" size="icon" className="bg-barbackground border-none hover:bg-barbackgroundhover">
            <Sun
                className={`h-[1.2rem] w-[1.2rem] transition-transform duration-500 ${
                    theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
                }`}
            />
            <Moon
                className={`absolute h-[1.2rem] w-[1.2rem] transition-transform duration-500 ${
                    theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"
                }`}
            />
            {/* <span className="sr-only">Toggle theme</span> */}
        </Button>
    );
}
