import Footer from "./_components/footer"
import Navbar from "./_components/navbar"
function MarketingLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full bg-secondary">
      <Navbar />
      <main className="pt-40 pb-20 bg-secondary">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default MarketingLayout
