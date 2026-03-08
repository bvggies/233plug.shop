"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHero } from "@/components/ui/PageHero";
import { Shield, ArrowLeft } from "lucide-react";
import type { SitePage } from "@/types";

const DEFAULT_PRIVACY_TITLE = "Privacy Policy";

const FALLBACK_PRIVACY_CONTENT = `## Introduction

233Plug ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, place orders, or contact us. Please read this policy carefully. By using our site or services, you consent to the practices described here. If you do not agree with this policy, please do not use our website or services.

**Last updated:** We may update the "Last updated" date at the top of this page when we make changes. Your continued use after any update constitutes acceptance of the revised policy.

---

## Information we collect

We collect information that you provide directly, information we obtain automatically when you use our services, and information we receive from third parties where relevant.

### Information you provide

- **Account and profile:** When you register or update your account, we collect your name, email address, phone number (if provided), and delivery/shipping address.
- **Orders and checkout:** When you place an order, we collect billing and shipping details, contact information, and order preferences. We do not store full credit or debit card numbers; payment data is processed securely by our payment providers (e.g. Paystack, Stripe).
- **Contact and enquiries:** When you use our Contact form or otherwise get in touch, we collect your name, email address, subject, and message content.
- **Quote and request forms:** When you submit a product or custom request, we collect the information you enter (e.g. product name, description, quantities) along with your account or contact details.
- **Communications:** If you contact us by email, phone, or other channels, we may keep records of those communications.

### Information collected automatically

- **Usage data:** We collect information about how you use our website, including pages visited, links clicked, time spent on pages, and referring URLs.
- **Device and technical data:** We may collect device type, browser type and version, operating system, IP address, and similar technical identifiers. This helps us operate the site, prevent abuse, and improve performance.
- **Cookies and similar technologies:** See the "Cookies and similar technologies" section below.

### Information from third parties

- **Payment providers:** We receive confirmation of payment status and transaction identifiers from our payment processors; we do not receive or store your full card details.
- **Shipping and logistics:** We may receive tracking and delivery status information from carriers when we fulfil orders.

---

## How we use your information

We use the information we collect to:

- **Provide and operate our services:** Process orders, manage your account, and deliver products and support.
- **Communicate with you:** Send order confirmations, shipping updates, quote responses, and replies to your enquiries. With your consent where required, we may send marketing or promotional communications; you can opt out at any time.
- **Improve our services:** Analyze usage patterns, fix errors, and develop new features and content.
- **Security and fraud prevention:** Protect our website, users, and business from fraud, abuse, and illegal activity.
- **Legal and compliance:** Comply with applicable laws, regulations, and legal process, and enforce our terms and policies.

We do not sell your personal data to third parties for their marketing purposes.

---

## Legal basis for processing (EEA/UK)

If you are in the European Economic Area or the United Kingdom, we process your personal data on the following bases where applicable:

- **Contract:** Processing necessary to perform our contract with you (e.g. fulfilling orders, managing your account).
- **Legitimate interests:** Processing necessary for our legitimate interests (e.g. improving our site, security, analytics) where these are not overridden by your rights.
- **Consent:** Where we have asked for your consent (e.g. certain marketing or optional communications).
- **Legal obligation:** Where we must process data to comply with law.

You may have the right to withdraw consent or object to certain processing; see "Your rights" below.

---

## Sharing and disclosure of your information

We may share your information in the following circumstances:

- **Service providers:** With trusted third parties who assist us in operating our website, processing payments, fulfilling orders, sending emails, or providing analytics. These providers are contractually required to protect your data and use it only for the purposes we specify.
- **Payment processors:** Payment details are shared only with our certified payment providers (e.g. Paystack, Stripe); we do not store full card numbers on our servers.
- **Shipping and delivery:** We share necessary delivery details with carriers and logistics partners to fulfil orders.
- **Legal requirements:** When required by law, court order, or government request, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
- **Business transfers:** In connection with a merger, sale of assets, or acquisition, your information may be transferred as part of that transaction, subject to the same privacy commitments.

We do not sell, rent, or trade your personal information to third parties for their marketing purposes.

---

## Cookies and similar technologies

We use cookies and similar technologies (e.g. local storage, session storage) to:

- **Keep you signed in** and maintain your session.
- **Remember your preferences** (e.g. language, region).
- **Understand how our site is used** (e.g. analytics) so we can improve content and experience.
- **Support security** and help prevent fraud and abuse.

You can control cookies through your browser settings. Disabling or blocking certain cookies may affect the functionality of our website (for example, you may need to sign in again or some features may not work as intended).

---

## Data retention

We retain your information only for as long as necessary to fulfil the purposes described in this policy, unless a longer retention period is required or permitted by law. For example:

- **Account data:** For the duration of your account and a reasonable period after closure for legal and support purposes.
- **Order and transaction data:** For the period required for accounting, tax, and legal compliance (typically several years).
- **Contact form and enquiry data:** For as long as needed to respond and handle follow-up, then in accordance with our general retention practices.
- **Logs and technical data:** For a limited period necessary for security, debugging, and analytics.

After the retention period, we securely delete or anonymize your data where possible.

---

## Data security

We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:

- Use of encryption (e.g. HTTPS/TLS) for data in transit.
- Secure storage and access controls for data at rest.
- Reliance on certified payment providers for payment processing; we do not store full card numbers.
- Regular review of our security practices and training of personnel.

No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security. You are responsible for keeping your account credentials confidential.

---

## International transfers

Your information may be processed and stored in countries other than your country of residence, including countries that may have different data protection laws. Where we transfer data internationally, we take steps to ensure that your data receives an adequate level of protection, including through standard contractual clauses or other approved mechanisms where required by law.

---

## Your rights

Depending on your location, you may have rights in relation to your personal data, which may include:

- **Access:** Request a copy of the personal data we hold about you.
- **Correction:** Request correction of inaccurate or incomplete data.
- **Erasure:** Request deletion of your personal data in certain circumstances.
- **Restriction:** Request that we restrict processing in certain circumstances.
- **Portability:** Request a copy of your data in a structured, machine-readable format where applicable.
- **Objection:** Object to processing based on legitimate interests or to direct marketing.
- **Withdraw consent:** Where processing is based on consent, withdraw that consent at any time.
- **Complaint:** Lodge a complaint with a supervisory authority in your country.

To exercise any of these rights, please contact us using the details in the "Contact" section below. We will respond in accordance with applicable law. We may need to verify your identity before processing your request.

---

## Children's privacy

Our website and services are not directed to individuals under the age of 16 (or the applicable age of consent in your jurisdiction). We do not knowingly collect personal data from children. If you believe we have collected information from a child, please contact us and we will take steps to delete such information.

---

## Third-party links and services

Our website may contain links to third-party websites, plug-ins, or services (e.g. social media, payment pages). This Privacy Policy does not apply to those third parties. We are not responsible for their privacy practices. We encourage you to read the privacy policies of any third-party sites you visit.

---

## Changes to this policy

We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will post the updated policy on this page and update the "Last updated" date. For material changes, we may also notify you by email or through a notice on our website. Your continued use of our services after the effective date of any changes constitutes your acceptance of the revised policy.

---

## Contact

For any privacy-related questions, requests, or concerns—including to exercise your rights or report a data incident—please contact us:

- **Contact page:** Use the form on our [Contact](/contact) page.
- **Email:** Use the email address provided on our Contact page or in our website footer.

We will respond to your request in accordance with applicable data protection laws.`;

export default function PrivacyPage() {
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("site_pages")
        .select("*")
        .eq("slug", "privacy")
        .single();
      setPage(data as SitePage);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Skeleton className="h-12 w-64 mb-6 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-6">Page not found.</p>
        <Link href="/" className="btn-primary">
          Go home
        </Link>
      </div>
    );
  }

  const title = page.title || DEFAULT_PRIVACY_TITLE;
  const hasContent = page.content?.trim();

  return (
    <div className="min-h-screen">
      <PageHero
        title={title}
        subtitle={page.meta_description ?? undefined}
        imageUrl="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80"
        icon={<Shield className="w-10 h-10 text-white" />}
      />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="max-w-4xl mx-auto px-4 pb-20 -mt-2"
      >
        <div className="surface-card p-8 md:p-12">
          {hasContent ? (
            <ContentRenderer content={page.content!} />
          ) : (
            <ContentRenderer content={FALLBACK_PRIVACY_CONTENT} />
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <Link href="/contact" className="btn-primary">
            Contact us
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
