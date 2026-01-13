import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - Lockstep";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Learn how Lockstep protects your privacy. Our privacy policy explains data collection, usage, security measures, and your rights."
      );
    }
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

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

        <h1 className="text-display-lg font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: January 13, 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-foreground/90 leading-relaxed">
              At Lockstep, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our event planning and RSVP tracking
              service. Please read this privacy policy carefully. If you do not
              agree with the terms of this privacy policy, please do not access
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Personal Information
            </h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>
                Account information: name, email address, password, and profile
                picture
              </li>
              <li>
                Event information: event details, dates, locations, and
                descriptions
              </li>
              <li>Guest information: names, email addresses, and RSVP status</li>
              <li>Communication data: messages and notifications you send</li>
              <li>Payment information: billing details for paid subscriptions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Automatically Collected Information
            </h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              When you use Lockstep, we automatically collect certain
              information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>
                Device information: IP address, browser type, operating system
              </li>
              <li>
                Usage data: pages visited, features used, time spent on the
                Service
              </li>
              <li>
                Cookies and tracking technologies: to enhance user experience
                and analyze usage
              </li>
              <li>Location data: general geographic location based on IP address</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Provide, maintain, and improve the Service</li>
              <li>Create and manage your account</li>
              <li>Process your events and RSVP responses</li>
              <li>Send notifications, reminders, and event updates</li>
              <li>Process payments and manage subscriptions</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Analyze usage patterns and optimize the user experience</li>
              <li>
                Detect, prevent, and address technical issues and security
                threats
              </li>
              <li>
                Send marketing communications (with your consent, where required)
              </li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Share Your Information
            </h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              With Event Participants
            </h3>
            <p className="text-foreground/90 leading-relaxed">
              When you create an event or RSVP to one, certain information (like
              your name and RSVP status) may be visible to other event
              participants and the event organizer.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              With Service Providers
            </h3>
            <p className="text-foreground/90 leading-relaxed">
              We share information with third-party service providers who help
              us operate the Service, including hosting, email delivery, payment
              processing, and analytics providers.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              For Legal Compliance
            </h3>
            <p className="text-foreground/90 leading-relaxed">
              We may disclose your information if required by law, court order,
              or government regulation, or to protect the rights, property, or
              safety of Lockstep, our users, or others.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Business Transfers
            </h3>
            <p className="text-foreground/90 leading-relaxed">
              If Lockstep is involved in a merger, acquisition, or sale of
              assets, your information may be transferred as part of that
              transaction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We implement appropriate technical and organizational security
              measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection best practices</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic
              storage is 100% secure. While we strive to protect your
              information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p className="text-foreground/90 leading-relaxed">
              We retain your information for as long as your account is active or
              as needed to provide the Service. You can request deletion of your
              account and personal information at any time. We may retain certain
              information as required by law or for legitimate business purposes,
              such as fraud prevention and record-keeping.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding
              your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>
                <strong>Access:</strong> Request a copy of the information we
                hold about you
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                information
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a
                machine-readable format
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your
                information
              </li>
              <li>
                <strong>Withdrawal of consent:</strong> Withdraw consent for
                processing where applicable
              </li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              To exercise these rights, please contact us at{" "}
              <a
                href="mailto:privacy@lockstep.com"
                className="text-primary hover:underline"
              >
                privacy@lockstep.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              7. Cookies and Tracking
            </h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Analyze how you use the Service</li>
              <li>Deliver personalized content</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mt-4">
              You can control cookies through your browser settings. Note that
              disabling cookies may affect the functionality of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. Third-Party Services
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              Lockstep may integrate with third-party services (such as calendar
              applications and payment processors). These third parties have
              their own privacy policies, and we are not responsible for their
              practices. We encourage you to review their privacy policies before
              connecting them to Lockstep.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Children's Privacy
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              Lockstep is not intended for children under 13 years of age. We do
              not knowingly collect personal information from children under 13.
              If you believe we have collected information from a child under 13,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              Your information may be transferred to and processed in countries
              other than your country of residence. These countries may have
              different data protection laws. By using Lockstep, you consent to
              the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify
              you of material changes by posting the new policy on this page and
              updating the "Last updated" date. Your continued use of the Service
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              12. California Privacy Rights
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              California residents have additional rights under the California
              Consumer Privacy Act (CCPA), including the right to know what
              personal information we collect, the right to delete personal
              information, and the right to opt-out of the sale of personal
              information. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              13. European Privacy Rights
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              If you are located in the European Economic Area (EEA), you have
              rights under the General Data Protection Regulation (GDPR),
              including the rights described in Section 6 above. Our legal basis
              for processing your information includes consent, contract
              performance, legal obligations, and legitimate interests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our
              data practices, please contact us at:
            </p>
            <div className="mt-4 text-foreground/90">
              <p>Email:{" "}
                <a
                  href="mailto:privacy@lockstep.com"
                  className="text-primary hover:underline"
                >
                  privacy@lockstep.com
                </a>
              </p>
              <p className="mt-2">
                Privacy Officer
                <br />
                Lockstep
              </p>
            </div>
          </section>
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
