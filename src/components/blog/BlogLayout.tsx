import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type BlogLayoutProps = {
  children: React.ReactNode;
};

const BlogLayout = ({ children }: BlogLayoutProps) => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-24 pb-16 px-6 lg:px-[120px]">{children}</main>
    <Footer />
  </div>
);

export const BlogBackLink = () => (
  <Link
    to="/blog"
    className="text-muted-foreground text-sm hover:text-foreground transition-colors mb-8 inline-block"
  >
    ← Все статьи
  </Link>
);

export default BlogLayout;
