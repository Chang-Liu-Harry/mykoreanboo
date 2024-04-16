// import Link from 'next/link'
import { Link } from 'next-view-transitions'
import localFont from 'next/font/local'
import { Poppins } from 'next/font/google'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// TODO: Add the font to the project
const headingFont = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

const textFont = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

const LandingPage = () => {
  return (
    <div className="flex items-center justify-center flex-col">
      {/* Start of title section */}
      <div className={cn('flex items-center justify-center flex-col', headingFont.className)}>
        <h1 className="text-3xl md:text-6xl text-center text-secondary-foreground mb-6">mind.ai makes celebrities talk to you</h1>

        <div className="text-3xl md:text-6xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-4 p-2 rounded-md pb-4 w-fit">
          in your home
        </div>
      </div>
      {/* End of title section */}

      <div className={cn('text-small md:text-xl text-neutral-400 mt-4 max-w-xs md:max-w-2xl text-center mx-auto', textFont.className)}>
        Description of the product
      </div>
      <Button className="mt-6" size="lg" asChild>
        <Link href="/sign-up">
          Get mind.ai for free
        </Link>
      </Button>
    </div>
  )
}

export default LandingPage