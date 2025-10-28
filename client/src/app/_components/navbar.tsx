"use client";
import React, { useState } from "react";
import { Menu } from "@/components/ui/navbar-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Navbar({ className }: { className?: string }) {
	const [active, setActive] = useState<string | null>(null);
	return (
		<div className={cn("fixed top-10 inset-x-0 w-[80%] max-w-md sm:max-w-sm mx-auto z-50 px-x py-5 sm:p-4", className)}>
			<Menu setActive={setActive}>
				<div className="font-semibol text-sm pr-3">Home</div>
				<div className="font-semibol text-sm pr-3">Products</div>
				<div
					id="gooey-btn"
					className="relative flex items-center group"
					style={{ filter: "url(#gooey-filter)" }}>
					<Link
						href={"/dashboard"}
						className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10">
						App
					</Link>
				</div>
			</Menu>
		</div>
	);
}
