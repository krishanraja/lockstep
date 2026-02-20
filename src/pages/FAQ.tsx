import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  useEffect(() => {
    document.title = "Frequently Asked Questions - Lockstep";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Find answers to common questions about Lockstep. Learn about event creation, RSVP tracking, pricing, integrations, and more."
      );
    }
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "What is Lockstep?",
          a: "Lockstep is a powerful event planning and RSVP tracking platform that helps you organize group events, manage guest responses, and coordinate schedules. Whether you're planning a wedding, corporate event, or casual gathering, Lockstep streamlines the entire process.",
        },
        {
          q: "How do I create an account?",
          a: "Creating an account is simple. Click 'Sign In' on the homepage, then select 'Sign up with Google' or enter your email and password. You'll be able to start creating events immediately after signing up.",
        },
        {
          q: "Is Lockstep free to use?",
          a: "Yes! Lockstep offers a free plan that includes up to 3 active events and 50 guests per event. For larger events or advanced features, we offer Pro and Business plans. Check out our pricing page for more details.",
        },
      ],
    },
    {
      category: "Event Management",
      questions: [
        {
          q: "How do I create an event?",
          a: "After signing in, click 'Create Event' from your dashboard. Follow the 6-step wizard to add event details, set dates, configure RSVP options, customize your event page, and send invitations. The process takes just a few minutes.",
        },
        {
          q: "Can I create multiple date options for my event?",
          a: "Absolutely! Lockstep supports date polling, allowing you to propose multiple date options and let your guests vote on their preferred dates. This makes scheduling group events much easier.",
        },
        {
          q: "How many guests can I invite?",
          a: "The guest limit depends on your plan. Free accounts can invite up to 50 guests per event, Pro accounts up to 200, and Business accounts have unlimited guests.",
        },
        {
          q: "Can I customize my event page?",
          a: "Yes! You can customize your event title, description, add a custom URL, upload images, and configure RSVP options. Pro and Business plans offer additional branding customization options.",
        },
      ],
    },
    {
      category: "RSVP & Guest Management",
      questions: [
        {
          q: "How do guests RSVP?",
          a: "Guests receive a unique RSVP link via email. They simply click the link, view event details, and select their response (Coming, Maybe, or Can't Come). No account required for guests!",
        },
        {
          q: "Can guests change their RSVP?",
          a: "Yes, guests can update their RSVP anytime using their unique link. As the organizer, you'll see real-time updates in your dashboard.",
        },
        {
          q: "Do I get notified when someone RSVPs?",
          a: "Yes! You'll receive email notifications when guests respond, and you can track all responses in real-time from your event dashboard.",
        },
        {
          q: "Can I send reminders to guests who haven't responded?",
          a: "Yes, Pro and Business plans include automated reminder features. You can also manually send reminder emails to specific guests or all pending invitees.",
        },
      ],
    },
    {
      category: "Integrations & Features",
      questions: [
        {
          q: "Does Lockstep integrate with my calendar?",
          a: "Yes! Lockstep integrates with Google Calendar, Apple Calendar, and Outlook. Guests can add events directly to their calendars with one click.",
        },
        {
          q: "Can I export my guest list?",
          a: "Absolutely. You can export your guest list and RSVP data to CSV format from your event dashboard.",
        },
        {
          q: "Does Lockstep work on mobile devices?",
          a: "Yes! Lockstep is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.",
        },
        {
          q: "Can I track event analytics?",
          a: "Pro and Business plans include detailed analytics showing response rates, engagement trends, and guest behavior over time.",
        },
      ],
    },
    {
      category: "Pricing & Plans",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor, Stripe.",
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Yes, you can cancel your subscription at any time from your account settings. Your plan will remain active until the end of your billing period.",
        },
        {
          q: "What happens if I exceed my plan limits?",
          a: "If you reach your plan's guest or event limits, you'll be prompted to upgrade to the next tier. You can upgrade instantly without losing any data.",
        },
        {
          q: "Do you offer discounts for annual plans?",
          a: "Yes! Annual plans receive a 20% discount compared to monthly billing. This is automatically applied when you select annual billing.",
        },
      ],
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "Is my data secure?",
          a: "Absolutely. We use industry-standard encryption, secure authentication, and regular security audits. Your data is stored on enterprise-grade infrastructure with automatic backups.",
        },
        {
          q: "Who can see my event information?",
          a: "Only people with the RSVP link can view your event. You control the visibility and can make events private or public based on your preferences.",
        },
        {
          q: "Do you sell or share my data?",
          a: "Never. We do not sell, rent, or share your personal information with third parties for marketing purposes. Read our privacy policy for full details.",
        },
        {
          q: "Can I delete my account and data?",
          a: "Yes, you can permanently delete your account and all associated data from your account settings. This action is irreversible.",
        },
      ],
    },
    {
      category: "Troubleshooting",
      questions: [
        {
          q: "I didn't receive my RSVP link. What should I do?",
          a: "First, check your spam folder. If you still can't find it, contact the event organizer to resend the invitation. Organizers can resend links from their event dashboard.",
        },
        {
          q: "My event link isn't working. How do I fix it?",
          a: "Ensure you're using the complete link including the unique token. If problems persist, contact support at support@lockstep.com with your event details.",
        },
        {
          q: "How do I contact support?",
          a: "You can reach our support team at support@lockstep.com. Pro and Business customers have access to priority support with faster response times.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.div
        className="container mx-auto px-4 py-16 max-w-4xl"
        {...fadeIn}
      >
        <Link
          to="/"
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-8"
        >
          ← Back to Home
        </Link>

        <h1 className="text-display-lg font-bold mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          Everything you need to know about Lockstep. Can't find what you're
          looking for? Email us at{" "}
          <a
            href="mailto:support@lockstep.com"
            className="text-primary hover:underline"
          >
            support@lockstep.com
          </a>
        </p>

        <div className="space-y-12">
          {faqs.map((category, idx) => (
            <section key={idx}>
              <h2 className="text-2xl font-semibold mb-6 text-primary">
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                {category.questions.map((faq, qIdx) => (
                  <AccordionItem
                    key={qIdx}
                    value={`${idx}-${qIdx}`}
                    className="border border-border rounded-lg px-6 bg-card/30"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-6">
                      <span className="font-medium text-lg">{faq.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 leading-relaxed pb-6">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-16 p-8 bg-card/50 border border-border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
          <p className="text-foreground/80 mb-6">
            Our support team is here to help. Reach out and we'll get back to
            you as soon as possible.
          </p>
          <a
            href="mailto:support@lockstep.com"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>

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
