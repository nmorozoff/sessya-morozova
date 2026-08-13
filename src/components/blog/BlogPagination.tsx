import { Link } from "react-router-dom";
import { blogIndexPath, getTotalBlogPages } from "@/lib/blog/manifest";

type BlogPaginationProps = {
  currentPage: number;
};

const BlogPagination = ({ currentPage }: BlogPaginationProps) => {
  const totalPages = getTotalBlogPages();

  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-wrap justify-center gap-2 mt-10" aria-label="Навигация по страницам блога">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
        const isActive = page === currentPage;
        return (
          <Link
            key={page}
            to={blogIndexPath(page)}
            className={
              isActive
                ? "min-w-10 h-10 inline-flex items-center justify-center rounded-[10px] bg-primary text-primary-foreground text-sm font-bold"
                : "min-w-10 h-10 inline-flex items-center justify-center rounded-[10px] border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            }
            aria-current={isActive ? "page" : undefined}
          >
            {page}
          </Link>
        );
      })}
    </nav>
  );
};

export default BlogPagination;
