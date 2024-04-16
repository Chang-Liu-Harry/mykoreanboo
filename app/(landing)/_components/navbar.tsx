'use client'
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
// import Link from "next/link";
import { Link } from 'next-view-transitions'
import { ModeToggle } from "@/components/theme-toggle";

// change your font here...
const font = Poppins({
  weight: "600",
  subsets: ["latin"],
})

const Navbar = () => {
  return (
    <div className="fixed w-full z-50 flex justify-between items-center py-2 px-4 border-b border-primary/10 bg-secondary h-16">
      <div className="flex items-center">
        <Link href="/">
          <h1 className={cn("block text-xl md:text-3xl font-bold text-primary", font.className)}>
            mind.ai
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-x-3">
        <ModeToggle />
      </div>
    </div>
  );
}

export default Navbar;