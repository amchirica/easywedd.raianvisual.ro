import type { ro } from "@/lib/i18n/dictionaries/ro";
import { appEn } from "@/lib/i18n/dictionaries/app-strings";

/** English dictionary — keep keys aligned with `ro`. */
export const en = {
  meta: {
    titleDefault: "EasyWedd — Wedding planning, elegant and simple",
    titleTemplate: "%s · EasyWedd",
    description:
      "EasyWedd is the platform for couples planning their wedding: planner, invitations, and website — in one place.",
    ogDescription:
      "Planner, digital invitations, and wedding website — in one space.",
    twitterTitle: "EasyWedd — Wedding planning",
    homeTitle:
      "EasyWedd — Wedding planning app | Budget, guests, seating",
    homeDescription:
      "EasyWedd helps couples plan their wedding: guest list, budget, seating plan, vendors, checklist, and digital invitations — in one place.",
    featuresTitle: "Features",
    featuresDescription:
      "EasyWedd modules for wedding planning: dashboard, guests, seating, budget, vendors, tasks, calendar, schedule, and documents.",
    pricingTitle: "Pricing",
    pricingDescription:
      "EasyWedd plans for wedding planning. EasyWedd is for couples; EasyWedd Pro is for vendors.",
    privacyTitle: "Privacy",
    termsTitle: "Terms",
    loginTitle: "Sign in",
    registerTitle: "Sign up",
    forgotTitle: "Forgot password",
    checkEmailTitle: "Check your email",
    resetPasswordTitle: "Set a new password",
    passwordUpdatedTitle: "Password updated",
    confirmedTitle: "Account confirmed",
    authErrorTitle: "Sign-in link",
  },
  preferences: {
    language: "Language",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    localeRo: "RO",
    localeEn: "EN",
    switchLanguage: "Switch language",
    switchTheme: "Switch theme",
  },
  common: {
    backToSite: "Back to site",
    loading: "Loading…",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    continue: "Continue",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    optional: "optional",
    demoUi: "Demo UI",
    recommended: "Recommended",
    free: "Free",
    perMonth: "/month",
    oneTime: "One-time",
    accessMonths: "{n} months access",
    subscription: "Subscription",
    start: "Start",
    choosePlan: "Choose plan",
    contactUs: "Contact us",
    edit: "Edit",
    exportCsv: "Export CSV",
    exportPdfPrint: "Export PDF / Print",
    exporting: "Exporting…",
    exportFailed: "Export failed",
    error: "Error",
    back: "Back",
    delete: "Delete",
    yes: "Yes",
    no: "No",
    all: "All",
    status: "Status",
    actions: "Actions",
  },
  navigation: {
    howItWorks: "How it works",
    features: "Features",
    featuresPage: "Features",
    vendors: "Vendors",
    pricing: "Pricing",
    faq: "FAQ",
    pro: "EasyWedd Pro",
    login: "Sign in",
    signup: "Start",
    signupLong: "Start planning",
    product: "Product",
    legal: "Legal",
    privacy: "Privacy",
    terms: "Terms",
    forVendors: "For vendors → EasyWedd Pro",
    createAccount: "Create account",
    footerTagline: "Plan the wedding. Without the chaos.",
    footerRights: "All rights reserved.",
    footerBlurb:
      "A platform for planning weddings and personal celebrations.",
  },
  hero: {
    eyebrow: "Wedding planning, simplified.",
    brand: "EasyWedd",
    title: "Your wedding. Organized in one place.",
    subtitle:
      "From the first guest list to the last vendor payment, EasyWedd helps you stay in control of the entire plan.",
    ctaPrimary: "Start planning",
    ctaSecondary: "See how it works",
    footnote:
      "Everything you need for your wedding — without chat and spreadsheet chaos.",
  },
  problem: {
    title: "A wedding means hundreds of details.",
    description:
      "It shouldn’t also mean hundreds of chats, sheets, and notes.",
    closing: "EasyWedd brings all of it into one system.",
    items: [
      "WhatsApp threads",
      "Guest spreadsheets",
      "Phone notes",
      "Contracts in email",
      "Forgotten deposits",
      "Vendors saved in chats",
      "Scattered deadlines",
      "Who’s coming / who confirmed",
      "What’s still to buy",
      "Schedule and budget",
    ],
  },
  modules: {
    eyebrow: "Modules",
    title: "Everything you need for your wedding, in one place.",
    description:
      "Guests, budget, vendors, schedule, tasks, documents, and every detail — organized in a single app.",
    items: [
      {
        title: "Dashboard",
        items: [
          "Countdown to the day",
          "Planning progress",
          "Budget",
          "Guests",
          "Tasks",
          "Upcoming payments",
        ],
      },
      {
        title: "Guests",
        items: [
          "Guest list",
          "RSVP",
          "Family / group",
          "Table",
          "Menu",
          "Kids, allergies, lodging, transport",
        ],
      },
      {
        title: "Seating plan",
        items: ["Tables", "Guests", "Drag & drop", "Capacity", "Distribution"],
      },
      {
        title: "Budget",
        items: [
          "Total budget",
          "Estimated / contracted",
          "Paid / remaining",
          "Categories",
          "Vendors",
        ],
      },
      {
        title: "Vendors",
        items: [
          "Photo & video",
          "DJ / band",
          "Venue",
          "Decor & flowers",
          "Beauty, catering, transport",
        ],
      },
      {
        title: "Tasks",
        items: ["Checklist", "Deadline", "Owner", "Progress"],
      },
      {
        title: "Calendar",
        items: ["Appointments", "Meetings", "Payments", "Deadlines"],
      },
      {
        title: "Event schedule",
        items: [
          "Getting ready",
          "Ceremony / church",
          "Reception",
          "Special moments",
          "Vendors involved",
        ],
      },
      {
        title: "Documents",
        items: ["Contracts", "Quotes", "Invoices", "Vendor info"],
      },
    ],
  },
  vendors: {
    eyebrow: "Vendors",
    title: "All vendors. One place.",
    description:
      "Track contacts, quotes, contracts, and payments — without digging through email and chat.",
    trackTitle: "What you can track",
    track: [
      "Contact",
      "Quote",
      "Contract",
      "Deposit",
      "Payments",
      "Status",
      "Notes",
      "Documents",
    ],
    categories: [
      "Photo & video",
      "DJ / band",
      "Venue",
      "Decor & flowers",
      "Beauty",
      "Catering",
      "Transport",
      "Other services",
    ],
  },
  timeline: {
    eyebrow: "Journey",
    title: "From “Yes” to wedding day",
    description: "Indicative ranges — adapt them to your pace.",
    steps: [
      {
        when: "12–18 months",
        title: "Start",
        items: ["Date and budget", "Guest list", "Early research"],
      },
      {
        when: "6–12 months",
        title: "Key vendors",
        items: ["Venue", "Photo / video", "Music", "Decor"],
      },
      {
        when: "3–6 months",
        title: "Details",
        items: ["Invitations", "Menu", "Seating", "Schedule"],
      },
      {
        when: "Last month",
        title: "Wrap-up",
        items: ["Confirmations", "Payments", "Day-of timeline"],
      },
    ],
  },
  couple: {
    eyebrow: "Collaboration",
    title: "Plan together.",
    description:
      "Both partners can work in the same space — guests, budget, tasks, and vendors.",
    cards: [
      {
        title: "Shared workspace",
        body: "One place for your decisions — not separate phone notes.",
      },
      {
        title: "Clear roles",
        body: "Who owns guests, who owns budget, who owns vendors.",
      },
      {
        title: "Visible progress",
        body: "See what’s done and what’s left — without constant check-ins.",
      },
    ],
  },
  portal: {
    eyebrow: "For guests",
    title: "Website, digital invitation, and RSVP.",
    description:
      "Send digital invitations, publish a wedding site, and collect replies — within your plan limits.",
    items: [
      {
        title: "Digital invitation",
        body: "Elegant design, shareable link, RSVP tracking.",
      },
      {
        title: "Wedding website",
        body: "Essential guest info: when, where, schedule.",
      },
      {
        title: "RSVP",
        body: "Centralized replies — not endless chat threads.",
      },
    ],
  },
  ecosystem: {
    eyebrow: "Ecosystem",
    title: "Couples and vendors. Connected.",
    description:
      "EasyWedd is the couple’s app. EasyWedd Pro is the vendor system. Together they form an ecosystem for weddings & celebrations.",
    forCouples: "For couples",
    forVendors: "For vendors",
    couplesBody:
      "Organize guests, budget, vendors, schedule, and wedding details.",
    vendorsBody:
      "Leads, quotes, contracts, payments, projects, and client relationships.",
    discoverPro: "Discover EasyWedd Pro",
    availableNow: "Available now",
    comingSoon: "Coming soon",
    comingSoonNote:
      "Ecosystem vision — we don’t claim sync that isn’t live yet.",
    availableItems: [
      "Wedding planning in EasyWedd",
      "CRM & quotes in EasyWedd Pro",
      "Client portal for vendors",
      "Payments and projects on Pro",
    ],
    soonItems: [
      "Quote from Pro → visible in EasyWedd",
      "Signed contract → wedding documents",
      "Deposit → couple budget and payments",
      "Schedule synced with the vendor",
      "Couple questionnaire → vendor data",
    ],
    flow: ["Quote", "Contract", "Payment", "Schedule", "Questionnaire", "Documents"],
    footnote:
      "Also suited for civil ceremonies, baptisms, anniversaries, and other personal celebrations close to weddings & celebrations.",
  },
  circular: {
    eyebrow: "Flow",
    title: "A circle that closes.",
    description:
      "Couples, vendors, and the event — each on the right platform, with the same narrative thread.",
    couples: "Couples",
    pro: "EasyWedd Pro",
    event: "Event",
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Pricing for wedding planning.",
    description:
      "EasyWedd = personal event planning. EasyWedd Pro = business subscription for vendors. Plans don’t mix.",
    pageTitle: "Choose the right plan for your wedding.",
    pageDescription:
      "Pay online — even without an account yet. Access activates after Stripe confirmation. EasyWedd = personal event; EasyWedd Pro = vendor business.",
    vendorHintPrefix: "Are you a vendor? See",
    vendorHintLink: "EasyWedd Pro pricing",
    features: {
      guests: "Guests: up to {n}",
      invitations: "Digital invitations",
      websitePublic: "Public website",
      websiteDraft: "Draft website",
      seating: "Seating plan",
      vendors: "Vendors",
      pdf: "PDF export",
      analytics: "Analytics",
    },
  },
  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    items: [
      {
        q: "Who is EasyWedd for?",
        a: "For couples planning their wedding — and, in the same spirit, civil ceremonies, baptisms, anniversaries, or other personal events.",
      },
      {
        q: "Is EasyWedd a CRM?",
        a: "No. EasyWedd is the end-client app for organizing the event. EasyWedd Pro is the product for vendors.",
      },
      {
        q: "How does it relate to EasyWedd Pro?",
        a: "They form the same ecosystem: couples work in EasyWedd, vendors in EasyWedd Pro. Advanced sync ships as it becomes available and is clearly marked “coming soon” when not live yet.",
      },
      {
        q: "Can I invite my partner to the same space?",
        a: "Yes. Both partners can access the same workspace for guests, budget, tasks, and vendors.",
      },
      {
        q: "Can I start for free?",
        a: "Yes. There is a Free plan with core features. Upgrade when you need publishing, seating, or higher limits.",
      },
      {
        q: "Where do I see vendor pricing?",
        a: "On the EasyWedd Pro website.",
      },
    ],
  },
  proCta: {
    title: "Are you a vendor or professional?",
    description:
      "EasyWedd Pro is the system for leads, quotes, contracts, and projects — not for planning a personal wedding.",
    cta: "Go to EasyWedd Pro",
  },
  finalCta: {
    title: "Start planning — in one place.",
    description:
      "Create your account, add the wedding date, and bring guests, budget, and vendors home.",
    cta: "Start planning",
  },
  featuresPage: {
    eyebrow: "Features",
    title: "Everything you need for your wedding.",
    description:
      "Real EasyWedd modules — for couples who want control without spreadsheets and endless chats.",
    cta: "Start planning",
    modules: [
      {
        title: "Dashboard",
        description:
          "Countdown, progress, budget, guests, tasks, and upcoming payments — a clear overview.",
      },
      {
        title: "Guests",
        description:
          "Guest list, RSVP, family/group, table, menu, allergies, lodging, and transport.",
      },
      {
        title: "Seating plan",
        description:
          "Tables, guests, drag & drop, capacity, and distribution — without spreadsheet chaos.",
      },
      {
        title: "Budget",
        description:
          "Total budget, estimated/contracted, paid/remaining, by category and vendor.",
      },
      {
        title: "Vendors",
        description:
          "Photo & video, DJ, venue, decor, beauty, catering — contact, quotes, contracts, and payments.",
      },
      {
        title: "Tasks & calendar",
        description:
          "Checklist with deadline and owner, plus appointments, meetings, and due dates.",
      },
      {
        title: "Event schedule",
        description:
          "Getting ready, ceremony, reception, special moments, and vendors by hour.",
      },
      {
        title: "Documents & guest portal",
        description:
          "Contracts, quotes, invoices; digital invitation, wedding website, and RSVP.",
      },
    ],
  },
  legal: {
    privacyTitle: "Privacy policy",
    privacyIntro:
      "Personal data is collected only to facilitate wedding planning, communication between participants, and efficient event management. It is protected and not used automatically for marketing.",
    privacyConsentTitle: "Consents",
    privacyConsentBody:
      "Terms and privacy are required at registration. Marketing, analytics, and anonymized market research need separate consents.",
    privacyResearchTitle: "Industry research",
    privacyResearchBody:
      "Market research data is not used without explicit consent for anonymized industry research.",
    termsTitle: "Terms and conditions",
    termsIntro:
      "By using EasyWedd, you accept the terms below. The service is intended for planning personal events.",
  },
  auth: {
    loginTitle: "Sign in",
    loginSubtitle: "Continue planning your wedding in EasyWedd.",
    registerTitle: "Create account",
    registerSubtitle: "Start planning your wedding in one place.",
    forgotTitle: "Forgot password",
    forgotSubtitle: "Enter your email and we’ll send a reset link.",
    checkEmailTitle: "Check your email",
    checkEmailBody:
      "We’ve sent a message with next steps. Check Spam too.",
    passwordResetSuccess:
      "Password updated. You can sign in with your new password.",
    forgotPassword: "Forgot password?",
    submitLogin: "Sign in",
    submitRegister: "Create account",
    submitForgot: "Send reset link",
    noAccount: "Don’t have an account?",
    hasAccount: "Already have an account?",
    registerLink: "Sign up",
    loginLink: "Sign in",
    acceptTerms: "I accept the",
    termsLink: "Terms and conditions",
    acceptPrivacy: "I have read the",
    privacyLink: "Privacy policy",
    marketingOptIn: "I’d like to receive news and offers (optional)",
    analyticsOptIn: "Allow analytics to improve the product (optional)",
    passwordPlaceholder: "At least 8 characters",
    namePlaceholder: "Jane Smith",
    emailPlaceholder: "you@email.com",
    sending: "Sending…",
    processing: "Processing…",
    resendConfirmation: "Resend confirmation",
    resendIn: "Resend in {n}s",
    passwordRuleMin: "At least 8 characters",
    passwordRuleUpper: "At least one uppercase letter",
    passwordRuleLower: "At least one lowercase letter",
    passwordRuleNumber: "At least one number",
    resetTitle: "Set a new password",
    resetSubtitle:
      "Enter your new password (at least 8 characters) and confirm it. You can sign in after saving.",
    resetExpiredTitle: "Link expired",
    resetExpiredBody:
      "This link is no longer valid or was already used. Request a new link and use only the most recent email.",
    spamTip:
      "Also check Spam, Junk, or Promotions. Sometimes the message ends up there.",
    requestNewLink: "Request a new link",
    passwordUpdatedHeading: "Password changed",
    passwordUpdatedBody:
      "Your EasyWedd account password was updated successfully. You can sign in with the new password.",
    confirmedHeading: "Account confirmed",
    confirmedBody:
      "Your email address was verified. Your EasyWedd account is now active.",
    continueToAccount: "Continue to your account",
    errorExpiredTitle: "Link expired",
    errorExpiredBody:
      "This link is no longer valid or was already used. Request a new link and use only the most recent email.",
    errorEmailNotConfirmedTitle: "Email not confirmed",
    errorEmailNotConfirmedBody:
      "Confirm your email with the link you received, then sign in.",
    errorSuspendedTitle: "Account suspended",
    errorSuspendedBody: "This account is suspended. Contact support.",
    errorGenericTitle: "Something went wrong",
    errorGenericBody:
      "We couldn’t finish signing you in. Try again or request a new link.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    show: "Show",
    hide: "Hide",
    showPasswordAria: "Show password",
    hidePasswordAria: "Hide password",
    showConfirmAria: "Show confirmation",
    hideConfirmAria: "Hide confirmation",
    saveNewPassword: "Save new password",
    updatePassword: "Update password",
    linkExpiredPrompt: "Link expired?",
    autoRedirect: "Redirecting automatically in {n}s…",
    errors: {
      linkExpired:
        "The link expired. Request a new confirmation or password-reset message.",
      exchangeFailed:
        "The confirmation link is invalid or expired. Request a new message.",
      recoverySession:
        "The reset session is missing or expired. Request a new password link.",
      noUser: "We couldn’t finish signing you in. Try again.",
      accountSuspended: "This account is suspended. Contact support.",
      generic: "Sign-in failed. Try again.",
    },
  },
  onboarding: {
    title: "Set up your wedding space",
    subtitle: "A few details so we can start planning the right way.",
    successTitle: "You’re all set",
    successBody: "You can continue to the dashboard.",
    goDashboard: "Go to dashboard",
  },
  nav: {
    dashboard: "Overview",
    wedding: "Wedding",
    planner: "Planner",
    budget: "Budget",
    guests: "Guests",
    seating: "Seating",
    vendors: "Vendors",
    timeline: "Timeline",
    contacts: "Contacts",
    invitations: "Invitations",
    website: "Website",
    billing: "Billing",
    privacy: "Privacy",
    settings: "Settings",
  },
  settings: {
    language: "Language",
    timezone: "Timezone",
    saveProfile: "Save profile",
    saving: "Saving…",
    profileUpdated: "Profile updated.",
    activeWorkspace: "Active workspace",
    noWorkspace: "No workspace",
    signOut: "Sign out",
    name: "Name",
    workspaceName: "Workspace name",
    noRenamePermission: "You don’t have permission to rename this workspace.",
    adminWorkspaceProtected: " Admin workspaces are protected.",
    workspaceTypeImmutable:
      "Workspace type ({type}) can’t be changed from Settings.",
    saveWorkspace: "Save workspace",
    activeSuffix: " (active)",
    switching: "Switching…",
    activateWorkspace: "Activate selected workspace",
    currency: "Currency",
    saveWeddingPrefs: "Save wedding preferences",
    transactionalEmails: "Transactional emails",
    reminders: "Reminders",
    marketing: "Marketing",
    saveNotifications: "Save notifications",
    title: "Settings",
    subtitle: "Account, workspace, wedding preferences, and notifications.",
    authRequired: "Sign in to continue.",
    profileSection: "Profile",
    passwordSection: "Password",
    workspaceSection: "Workspace",
    weddingPrefsSection: "Wedding preferences",
    notificationsSection: "Notifications",
  },
  mock: {
    daysLeft: "days left",
    guests: "Guests",
    confirmed: "confirmed",
    budget: "Budget",
    spent: "spent",
    tasks: "Tasks",
    done: "done",
    vendors: "Vendors",
    booked: "booked",
    schedule: "Schedule",
  },
  assistant: {
    fabLabel: "EasyWedd Help",
    title: "EasyWedd Assistant",
    subtitle: "Ask me how the app works.",
    placeholder: "E.g. How do I add a guest?",
    send: "Send",
    close: "Close",
    thinking: "Looking it up…",
    helpful: "Was this helpful?",
    yes: "Yes",
    no: "No",
    feedbackThanks: "Thanks for the feedback.",
    feedbackPrompt: "Tell us what’s missing.",
    feedbackSend: "Send feedback",
    feedbackSkip: "Skip",
    errorGeneric: "I couldn’t answer right now. Try again.",
    errorRateLimit: "You’ve reached the message limit for now. Try again later.",
    errorAuth: "Sign in to use the assistant.",
    emptyHint: "Pick a quick question or type your own.",
    openLink: "Open {title}",
    openBilling: "Open Billing",
    whatYouCanDo: "What you can do:",
    steps: "Steps:",
    notes: "Notes:",
    featureUnavailable:
      "This feature is not active for your account right now.",
    unknownFallback:
      "This feature is not available in EasyWedd right now. Ask about Guests, Budget, Seating, Vendors, Planner, Timeline, Invitations, Website, or Settings.",
    emptyPrompt: "Ask me how a menu or feature works.",
    quick: {
      guests: "How do I add guests?",
      budget: "How does budget work?",
      seating: "How do I make a seating plan?",
      vendors: "How do I add vendors?",
      partner: "How do I invite my partner?",
      overview: "What can I do in EasyWedd?",
    },
  },
  ...appEn,
} as const;

// Compile-time key alignment check (fails typecheck if EN drifts from RO).
type _AssertEnKeys = typeof en extends {
  [K in keyof typeof ro]: unknown;
}
  ? true
  : never;
const _assertEnKeys: _AssertEnKeys = true;
void _assertEnKeys;
