import Link from "next/link";
import ModeToggle from "./mode-toggle";
import Image from "next/image";


export default function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background overflow-hidden">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 flex">
                    <Link href="/main" className="mr-6 flex items-center space-x-2">
                        <Image
                            className="mr-auto ml-10"
                            src="/images/logofull.svg"
                            alt="Logo image"
                            width={140}
                            height={140}
                        />
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none"></div>
                    <nav className="flex items-center">
                        <ModeToggle />
                    </nav>
                </div>
            </div>
        </header>
    );
}
