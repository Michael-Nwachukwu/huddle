
import { GradientBackground } from "@/components/gradient-background"
import { Instrument_Serif } from "next/font/google"
import Link from "next/link"

const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    display: "swap",
})

export default function Interlude() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <GradientBackground />
            <div className="absolute inset-0 -z-10 bg-black/20" />

            <section className="px-6 space-y-12">
                <h1
                    className={`${instrumentSerif.className} text-white text-center text-balance font-normal tracking-tight text-7xl`}
                >
                    the best way to grow is to collaborate
                </h1>
                <div id="gooey-btn" className="relative flex items-center justify-center group" style={{ filter: "url(#gooey-filter)" }}>
                    <Link
                        href={"/dashboard"}
                        className="px-7 rounded-full font-normal text-sm transition-all duration-300 bg-white/90 text-black cursor-pointer h-9 flex items-center z-10"
                    >
                        Start Collaborating
                    </Link>
                </div>
            </section>
        </section>
    )
}
