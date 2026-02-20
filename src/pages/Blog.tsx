import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export default function Blog() {
  useEffect(() => {
    document.title = "Blog - Lockstep | Event Planning Tips & Best Practices";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Discover event planning tips, RSVP management best practices, and product updates from the Lockstep team. Learn how to organize better events."
      );
    }
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const blogPosts = [
    {
      slug: "10-tips-for-managing-event-rsvps",
      title: "10 Essential Tips for Managing Event RSVPs Like a Pro",
      excerpt:
        "Learn proven strategies to track RSVPs, increase response rates, and manage guest lists efficiently for any event size.",
      category: "Event Planning",
      author: "Sarah Chen",
      date: "January 10, 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
      featured: true,
    },
    {
      slug: "why-traditional-event-planning-fails",
      title: "Why Traditional Event Planning Tools Are Failing Modern Organizers",
      excerpt:
        "Explore the limitations of spreadsheets and email threads, and discover why real-time collaboration tools are transforming event management.",
      category: "Industry Insights",
      author: "Marcus Rodriguez",
      date: "January 8, 2026",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
      featured: true,
    },
    {
      slug: "complete-guide-to-wedding-rsvp-etiquette",
      title: "The Complete Guide to Wedding RSVP Etiquette in 2026",
      excerpt:
        "Everything couples and guests need to know about wedding RSVP timing, wording, and best practices for stress-free planning.",
      category: "Weddings",
      author: "Emma Thompson",
      date: "January 5, 2026",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
      featured: false,
    },
    {
      slug: "how-to-increase-event-attendance",
      title: "5 Proven Strategies to Increase Event Attendance by 40%",
      excerpt:
        "Data-driven tactics to boost your event attendance rates, from invitation timing to follow-up reminders.",
      category: "Marketing",
      author: "David Kim",
      date: "January 3, 2026",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80",
      featured: false,
    },
    {
      slug: "corporate-event-planning-checklist",
      title: "The Ultimate Corporate Event Planning Checklist",
      excerpt:
        "A comprehensive checklist for organizing successful corporate events, from initial planning to post-event follow-up.",
      category: "Corporate Events",
      author: "Rachel Foster",
      date: "December 30, 2025",
      readTime: "10 min read",
      image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
      featured: false,
    },
    {
      slug: "birthday-party-planning-made-easy",
      title: "Birthday Party Planning Made Easy: A Step-by-Step Guide",
      excerpt:
        "Plan memorable birthday celebrations with our simple framework for guest lists, themes, and RSVP management.",
      category: "Celebrations",
      author: "Michael Torres",
      date: "December 27, 2025",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
      featured: false,
    },
  ];

  const categories = [
    "All Posts",
    "Event Planning",
    "Industry Insights",
    "Weddings",
    "Corporate Events",
    "Marketing",
    "Celebrations",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.div className="container mx-auto px-4 py-16" {...fadeIn}>
        <Link
          to="/"
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-8"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-display-lg font-bold mb-4">Lockstep Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert tips, best practices, and insights for organizing
            unforgettable events
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category, idx) => (
            <button
              key={idx}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                idx === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:border-primary/50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Posts */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Featured Articles</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {blogPosts
              .filter((post) => post.featured)
              .map((post, idx) => (
                <motion.article
                  key={idx}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="text-primary font-medium">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-foreground/80 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        By {post.author}
                      </span>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="text-primary hover:text-primary/80 flex items-center gap-2 font-medium"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
          </div>
        </section>

        {/* All Posts */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Recent Articles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts
              .filter((post) => !post.featured)
              .map((post, idx) => (
                <motion.article
                  key={idx}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx + 2) * 0.1 }}
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="text-primary font-medium">
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-foreground/70 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{post.date}</span>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                      >
                        Read
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="mt-16 p-12 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">
            Never Miss an Update
          </h2>
          <p className="text-foreground/80 mb-6 max-w-2xl mx-auto">
            Get the latest event planning tips, product updates, and exclusive
            insights delivered straight to your inbox.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
            />
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            to="/"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
