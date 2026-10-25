// dc-access-control.hazwoperosha.us: physical security and access control. Keypad / mantrap, black glass and signal green.
export default {
  brand: "Mantrap",
  logo: `<span class="mt-pad"></span>MANTRAP`,
  title: "Data Center Physical Security & Access Control Training | Mantrap",
  description: "Physical security training for data center staff and guards: access control, mantraps, tailgating, visitor management and security compliance.",
  theme: "#00c853",
  fonts: "family=Michroma&family=Inter:wght@400;500;600",
  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="5" y="2" width="22" height="28" rx="4" fill="#0b0f0c"/><rect x="9" y="6" width="14" height="5" rx="1" fill="#00c853"/><g fill="#3a4a3f"><circle cx="11" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/><circle cx="21" cy="16" r="1.6"/><circle cx="11" cy="21" r="1.6"/><circle cx="16" cy="21" r="1.6"/><circle cx="21" cy="21" r="1.6"/><circle cx="16" cy="26" r="1.6"/></g></svg>`,
  hero: {
    kicker: "Badge · biometric · escort",
    title: "One badge, <span>one person.</span>",
    lede: "The strongest firewall doesn't help if someone walks into the data hall behind a contractor. Physical security and access control training for staff, guards and facility teams.",
    cta: [828, "Access Control & Physical Security · $99.99"],
    alt: ["/guides/stopping-tailgating", "Stop tailgating"],
  },
  coursesTagline: "Physical security, access and compliance training.",
  guidesTagline: "Tailgating and layered security.",

  courses: [
    { id: 828, short: "Access Control & Physical Security" },
    { id: 855, short: "Physical Security & Access (1 hr)" },
    { id: 848, short: "Security & Compliance (SOC 2, ISO 27001)" },
  ],

  guides: [
    {
      slug: "stopping-tailgating",
      title: "Stopping tailgating",
      description: "The most common physical security failure, and the polite way to prevent it.",
      date: "2026-10-25",
      courses: [855, 828],
      body: `**Tailgating** (or piggybacking) is when someone follows an authorized person through a controlled door without badging.

## Why it happens

Politeness. Holding the door is a habit, and challenging someone feels awkward.

## Make it normal to challenge

Teach a simple line: *"Sorry, everyone has to badge in. Can you use yours?"* Leaders should model it and thank people who do it.

## Engineering controls

- **Mantraps** (two doors, only one open at a time)
- **Turnstiles** or optical portals that count people
- **Door-held and forced-door alarms** monitored by security
- **Cameras** at every controlled door

## If someone gets in

Don't confront anyone aggressively. Note their description and location, and call security right away.

{{buy:855}}`,
    },
    {
      slug: "layers-of-data-center-security",
      title: "The layers of data center physical security",
      description: "From the fence line to the rack, each layer narrows who gets through.",
      date: "2026-10-25",
      courses: [828, 848],
      body: `| Layer | Typical controls |
|---|---|
| **Perimeter** | Fencing, vehicle barriers, gates, cameras, lighting |
| **Building entry** | Guard desk, ID check, visitor registration |
| **Secure lobby** | Mantrap or turnstile, badge plus PIN or biometric |
| **Data hall** | Badge and biometric, cameras, logged access |
| **Cage or suite** | Customer-specific access, cage locks |
| **Rack** | Locked doors, electronic rack locks with logging |

## Principles

- **Least privilege**: people only get access to the layers they need
- **Defense in depth**: no single failure lets someone reach the IT equipment
- **Logging and review**: access records are reviewed, and access is removed promptly when it's no longer needed

These controls are also evidence for SOC 2 and ISO 27001 audits ([[848]]).`,
    },
  ],
};
