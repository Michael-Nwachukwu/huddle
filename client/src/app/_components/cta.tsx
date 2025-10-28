import Link from "next/link";

export default function CTA() {
    return (
        <div >
            <div className="mx-auto max-w-7xl py-14 sm:px-6 sm:py-32 lg:px-8">
                <div className="relative isolate overflow-hidden bg-gray-800 px-6 pt-16 after:pointer-events-none after:absolute after:inset-0 after:inset-ring after:inset-ring-white/10 sm:rounded-3xl sm:px-16 after:sm:rounded-3xl md:pt-24 lg:flex justify-center lg:gap--20 lg:px-24 lg:pt-0">

                    <svg
                        viewBox="0 0 1024 1024"
                        aria-hidden="true"
                        className="absolute top-1/2 left-1/2 -z-10 size-256 -translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
                    >
                        <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
                        <defs>
                            <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                                <stop stopColor="#7775D6" />
                                <stop offset={1} stopColor="#E935C1" />
                            </radialGradient>
                        </defs>
                    </svg>


                    <div className="mx-auto max-w-5xl sm:max-w-4xl text-center lg:mx-0 lg:flex-auto lg:py-28 pb-14">
                        <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-6xl">
                            Boost your productivity today.
                        </h2>
                        <p className="mt-6 text-lg/8 text-pretty text-gray-300">
                            Streamline tasks, collaborate seamlessly, and get more done with Huddle’s all-in-one workspace.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href="/dashboard"
                                className="rounded-md bg-gray-700 px-3.5 py-2.5 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                {' '}
                                Get started{' '}
                            </Link>
                            <a href="#" className="text-sm/6 font-semibold text-white hover:text-gray-100">
                                Learn more
                                <span aria-hidden="true">→</span>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
