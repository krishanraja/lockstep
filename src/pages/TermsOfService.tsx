import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service - Lockstep";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Read Lockstep's Terms of Service. Learn about our policies for group event planning, RSVP tracking, and user responsibilities."
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

        <h1 className="text-display-lg font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: January 13, 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              By accessing and using Lockstep ("the Service"), you accept and
              agree to be bound by the terms and provision of this agreement.
              If you do not agree to these Terms of Service, please do not use
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Lockstep provides a platform for organizing group events,
              tracking RSVPs, and coordinating schedules. The Service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Event creation and management tools</li>
              <li>RSVP tracking and guest communication</li>
              <li>Calendar integration</li>
              <li>Automated reminders and notifications</li>
              <li>Analytics and reporting features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To use certain features of Lockstep, you must register for an
              account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. User Responsibilities
            </h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              When using Lockstep, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>
                Use the Service only for lawful purposes and in accordance with
                these Terms
              </li>
              <li>
                Not use the Service to send spam or unsolicited communications
              </li>
              <li>
                Not attempt to interfere with or compromise the system integrity
                or security
              </li>
              <li>Not use the Service to transmit malware or malicious code</li>
              <li>
                Respect the intellectual property rights of Lockstep and other
                users
              </li>
              <li>
                Not collect or harvest personal information about other users
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Event Content</h2>
            <p className="text-foreground/90 leading-relaxed">
              You retain ownership of any content you create on Lockstep. By
              posting content, you grant Lockstep a non-exclusive, worldwide,
              royalty-free license to use, reproduce, and display your content
              solely to provide and improve the Service. You are responsible for
              ensuring your content does not violate any laws or third-party
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              6. Payment and Subscriptions
            </h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Lockstep offers both free and paid subscription plans. For paid
              plans:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
              <li>
                Subscription fees are billed in advance on a monthly or annual
                basis
              </li>
              <li>All fees are non-refundable except as required by law</li>
              <li>
                We reserve the right to change pricing with 30 days' notice
              </li>
              <li>
                Failure to pay may result in suspension or termination of your
                account
              </li>
              <li>Cancellations can be made at any time from your account settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              7. Privacy and Data Protection
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              Your privacy is important to us. Our collection and use of
              personal information is described in our{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . By using Lockstep, you consent to our data practices as
              described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. Intellectual Property
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              The Service and its original content, features, and functionality
              are owned by Lockstep and are protected by international
              copyright, trademark, patent, trade secret, and other intellectual
              property laws. Our trademarks may not be used without our prior
              written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOCKSTEP SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
              INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR
              GOODWILL ARISING OUT OF YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimer</h2>
            <p className="text-foreground/90 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. LOCKSTEP DOES
              NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR
              ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              11. Termination
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              We may terminate or suspend your account and access to the Service
              immediately, without prior notice, for any reason, including
              breach of these Terms. Upon termination, your right to use the
              Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              12. Changes to Terms
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will
              provide notice of material changes by posting the new Terms on
              this page and updating the "Last updated" date. Your continued use
              of the Service after changes constitutes acceptance of the new
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              13. Governing Law
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which Lockstep operates, without
              regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have any questions about these Terms, please contact us at{" "}
              <a
                href="mailto:legal@lockstep.com"
                className="text-primary hover:underline"
              >
                legal@lockstep.com
              </a>
            </p>
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
