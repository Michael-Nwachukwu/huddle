"use client"
import { useTheme } from "@/context/theme-context";
import Image from "next/image"

const Footer = () => {
    const { theme } = useTheme();

    return (
        <footer className="p-4 md:p-8 lg:p-10">
            <div className="mx-auto max-w-screen-xl text-center">
                <div className="pb-2 flex justify-center items-center">
                    {theme === "dark" ? (
                        <Image
                            src={"/logo-dark.svg"}
                            alt="Huddle"
                            className="w-28"
                            width={60}
                            height={40}
                        />
                    ) : (
                        <Image
                            src={"/logo-light-2.svg"}
                            alt="Huddle"
                            className="w-28"
                            width={60}
                            height={40}
                        />
                    )}
                </div>

                <p className="my-6 text-gray-500 dark:text-gray-400">The Decentralized Workspace for Teams, DAOs & Builders</p>
                <p className="my-6 text-lime-500">Built on Hashgraph&apos;s Hedera DLT</p>

                <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2025 <a href="#" className="hover:underline">Huddle™</a>. All Rights Reserved.</span>
            </div>
        </footer>
    )
}

export default Footer