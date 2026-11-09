// Owner articles shown at /owners/articles. Newest first.
// Each section has a heading plus paragraphs and/or bullets.
// Articles with disclaimer: true show a "general information only" note.

export const ARTICLES = [
  {
    slug: "brrrr-strategy-toronto",
    title: "BRRRR in Toronto: how it works, and where it gets hard",
    excerpt: "Buy, rehab, rent, refinance, repeat. A plain-English look at the strategy and what it takes to make it work here.",
    category: "Investing",
    date: "2026-11-09",
    readMinutes: 7,
    disclaimer: true,
    sections: [
      {
        paragraphs: [
          "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. The idea is to buy a property that's worth more once it's fixed up, renovate it, rent it out, then refinance at the new, higher value to pull your money back out for the next purchase.",
          "Done well, it lets you build a portfolio with the same pool of capital. Done badly, it leaves your cash stuck in a property that doesn't pay for itself.",
        ],
      },
      {
        heading: "The five steps",
        bullets: [
          "Buy: a property priced below what it would be worth after renovation, usually because it's dated, poorly maintained or under-rented",
          "Rehab: renovations that add the most value per dollar, like kitchens, bathrooms, flooring or adding a legal unit",
          "Rent: lease it to a well-screened tenant at the new market rent",
          "Refinance: have the property appraised at its new value and refinance, taking out some of your equity",
          "Repeat: use that equity as the down payment on the next property",
        ],
      },
      {
        heading: "Why it's harder in Toronto",
        paragraphs: [
          "Toronto prices are high relative to rents, so many properties don't cash flow after a refinance, especially condos with high monthly fees. Distressed properties are also competitive, and renovation costs can run over budget fast.",
          "Refinancing has limits too. Conventional refinances in Canada are generally capped at 80% of the appraised value, and some lenders want you to have owned the property for a while before they'll use the new appraisal. Talk to a mortgage broker before you buy, not after.",
        ],
      },
      {
        heading: "Where it can still work",
        bullets: [
          "Older houses that can legally add a basement, garden or laneway suite",
          "Dated units in good buildings where a renovation clearly lifts rent and value",
          "Properties that are under-rented or poorly managed today",
          "Locations near hospitals, universities and transit, where furnished mid-term demand is strong",
        ],
      },
      {
        heading: "How we help",
        paragraphs: [
          "We can run the numbers before you buy, scope and price the renovation through Homev Construction, carry out the work, then lease and manage the property. We'll also put together the rent and renovation records your lender or appraiser will want to see at refinance. The purchase itself goes through your realtor and the financing through your mortgage professional.",
        ],
      },
    ],
  },
  {
    slug: "condo-documents-to-check-before-buying-a-rental",
    title: "What to check in a condo's documents before buying a rental",
    excerpt: "The status certificate and building rules can make or break an investment. Here's what to look for.",
    category: "Investing",
    date: "2026-11-09",
    readMinutes: 5,
    disclaimer: true,
    sections: [
      {
        paragraphs: [
          "When you buy a condo in Ontario, your offer is usually conditional on reviewing the status certificate. It's a package from the condo corporation describing the building's finances, rules and any problems. For an investor, these are the pages that matter most.",
        ],
      },
      {
        heading: "Money",
        bullets: [
          "Monthly fees, and whether an increase is already planned",
          "The reserve fund balance and the latest reserve fund study",
          "Any special assessments, current or expected",
          "Whether the unit owes anything to the corporation",
        ],
      },
      {
        heading: "Rules that affect renting",
        bullets: [
          "The declaration and rules on short-term rentals, which many buildings restrict or ban",
          "Any minimum stay length or registration process for tenants",
          "Pet, smoking and move-in rules that could narrow your tenant pool",
        ],
      },
      {
        heading: "Red flags",
        bullets: [
          "Lawsuits involving the corporation",
          "Large repairs coming up with a thin reserve fund",
          "Insurance problems or a very high building deductible",
          "Construction defects or ongoing warranty claims in newer buildings",
        ],
      },
      {
        heading: "Get help reading it",
        paragraphs: [
          "Have your real estate lawyer review the status certificate before your condition deadline. We can also review the rental side with you: what the rules mean for long-term, mid-term and short-term rentals, and what that does to your expected income.",
        ],
      },
    ],
  },
  {
    slug: "rental-property-numbers-cap-rate-cash-flow",
    title: "Cap rate, cash flow and cash-on-cash return, explained simply",
    excerpt: "Three numbers every rental investor should work out before making an offer, with a worked example.",
    category: "Investing",
    date: "2026-11-09",
    readMinutes: 6,
    disclaimer: true,
    sections: [
      {
        paragraphs: [
          "Asking rent and purchase price alone tell you very little. These three numbers tell you whether a property actually works as an investment.",
        ],
      },
      {
        heading: "Net operating income (NOI)",
        paragraphs: [
          "NOI is your yearly rent minus the costs of running the property, before any mortgage payments. Include condo fees, property tax, insurance, maintenance, management, utilities you pay, and an allowance for vacancy.",
        ],
      },
      {
        heading: "Cap rate",
        paragraphs: [
          "Cap rate is NOI divided by the purchase price. It lets you compare properties regardless of how they're financed. A higher cap rate means more income for each dollar of price.",
        ],
      },
      {
        heading: "Cash flow",
        paragraphs: [
          "Cash flow is NOI minus your mortgage payments. It's what's actually left over each year, and in Toronto it's often small or negative at today's prices and rates. Know that before you buy, not after.",
        ],
      },
      {
        heading: "Cash-on-cash return",
        paragraphs: [
          "Cash-on-cash return is your yearly cash flow divided by the total cash you put in: down payment, closing costs, land transfer tax and any renovation. It shows what your own money is earning.",
        ],
      },
      {
        heading: "A simple example",
        paragraphs: [
          "These figures are made up to show the math, not a forecast for any property. They also show why so many Toronto condos don't cash flow with 20% down.",
        ],
        bullets: [
          "Rent of $3,000 a month is $36,000 a year",
          "Running costs of $12,000 a year leave an NOI of $24,000",
          "At a $700,000 purchase price, the cap rate is $24,000 ÷ $700,000 = 3.4%",
          "With 20% down, a $560,000 mortgage over 25 years at about 4.5% costs roughly $37,000 a year",
          "That leaves cash flow of about $24,000 − $37,000 = −$13,000 a year",
          "With $160,000 of your own cash in (down payment plus closing costs), cash-on-cash return is about −8%",
        ],
      },
      {
        heading: "What the numbers don't show",
        paragraphs: [
          "These measures leave out appreciation and the part of each mortgage payment that pays down your loan. In the example above, about $12,000 of the first year's payments goes to principal, so the owner is building equity even with negative cash flow. Whether that trade-off is worth it depends on your goals and finances. All of these numbers also depend heavily on your rent and cost estimates, which is where an experienced manager's numbers make a real difference.",
        ],
      },
    ],
  },
  {
    slug: "ontario-rent-control-new-vs-older-units",
    title: "New vs. older units: how Ontario rent control affects your returns",
    excerpt: "Whether a unit is exempt from the annual rent increase guideline can change its long-term value as a rental.",
    category: "Investing",
    date: "2026-11-09",
    readMinutes: 4,
    disclaimer: true,
    sections: [
      {
        paragraphs: [
          "In Ontario, most residential rents can only go up once a year, by no more than the provincial rent increase guideline, unless the Landlord and Tenant Board approves more. But not every unit is covered by that cap, and the difference matters for investors.",
        ],
      },
      {
        heading: "The November 15, 2018 rule",
        paragraphs: [
          "Units first occupied for residential purposes after November 15, 2018 are exempt from the rent increase guideline. For those units, you can raise the rent on renewal by more than the guideline, as long as you give proper notice and wait at least 12 months between increases.",
          "Older units stay under the guideline for as long as a tenant lives there. Rent can be reset to market rate only when a unit becomes vacant and a new tenant moves in.",
        ],
      },
      {
        heading: "What it means when you buy",
        bullets: [
          "A newer unit gives you more control over rent long-term",
          "An older unit with a long-term tenant paying well below market will likely stay below market for years",
          "Buying with a tenant in place means taking over their existing lease and rent",
          "Ask for the lease, rent history and proof of first occupancy date before you firm up an offer",
        ],
      },
      {
        heading: "Rules change",
        paragraphs: [
          "Rent rules are set by the province and can change. Check the current rules with the Landlord and Tenant Board or a legal professional before relying on them for a purchase.",
        ],
      },
    ],
  },
  {
    slug: "choose-your-rental-strategy-before-you-buy",
    title: "Choose your rental strategy before you buy, not after",
    excerpt: "The best rental property depends on how you plan to rent it. Decide first, then shop.",
    category: "Investing",
    date: "2026-11-09",
    readMinutes: 5,
    disclaimer: true,
    sections: [
      {
        paragraphs: [
          "Many investors buy a property they like and then work out how to rent it. Doing it the other way round leads to better purchases, because each strategy rewards different things.",
        ],
      },
      {
        heading: "Long-term rental",
        bullets: [
          "Look for: low condo fees, durable finishes, practical layouts, transit access",
          "Avoid: buildings with high fees or big upcoming repairs that eat into steady rent",
        ],
      },
      {
        heading: "Furnished mid-term rental",
        bullets: [
          "Look for: locations near hospitals, universities, business districts and transit",
          "Look for: buildings with good amenities and easy access for frequent move-ins",
          "Check: the building allows leases of a few months",
        ],
      },
      {
        heading: "Short-term rental",
        bullets: [
          "In Toronto, short-term rentals generally have to be in your principal residence, so most pure investment units don't qualify",
          "If you plan to live there, check the building's rules carefully before buying",
        ],
      },
      {
        heading: "Adding units",
        paragraphs: [
          "Toronto now allows additional units on many residential lots, such as basement, garden and laneway suites. A house that can legally add a unit can change the numbers completely. Homev Construction can assess what's possible on a property before you buy.",
        ],
      },
      {
        heading: "Don't forget",
        bullets: [
          "Toronto buyers pay both the Ontario and the Toronto land transfer tax",
          "Toronto's Vacant Home Tax can apply if a home sits empty for more than six months of the year",
          "Financing for investment properties usually needs a larger down payment than a home you live in",
        ],
      },
    ],
  },
  {
    slug: "long-term-mid-term-or-short-term-rental",
    title: "Long-term, mid-term or short-term: which rental strategy fits your Toronto property?",
    excerpt: "Three ways to rent the same unit, each with different income, effort and rules. Here's how to choose.",
    category: "Strategy",
    date: "2026-11-09",
    readMinutes: 6,
    sections: [
      {
        paragraphs: [
          "Most owners assume there are two choices: sign a tenant to a one-year lease, or list the unit on a nightly booking platform. In practice there are three, and the right one depends on your property, your building and how involved you want to be.",
        ],
      },
      {
        heading: "Long-term rentals (12-month leases)",
        paragraphs: [
          "A traditional lease gives you one tenant, one rent payment a month and the least turnover. It's the most predictable option and works in almost every building.",
          "The trade-offs: your rent is set for the year, rent increases on renewal are regulated in Ontario for many units, and a bad tenant is much harder to fix than a bad guest. That's why screening and a properly prepared lease matter so much.",
        ],
        bullets: [
          "Best for: owners who want steady, hands-off income",
          "Effort without a manager: low most months, high when something goes wrong",
          "Furnishing: not required",
        ],
      },
      {
        heading: "Furnished mid-term rentals (1 to 12 months)",
        paragraphs: [
          "Mid-term stays serve people who need a home for a few months: professionals on contract, medical staff, families relocating or renovating, and insurance placements. They pay more than a long-term tenant for a furnished, move-in-ready unit with utilities and internet included.",
          "Because stays are 28 nights or longer, mid-term rentals are often allowed in buildings and areas where nightly rentals aren't.",
        ],
        bullets: [
          "Best for: furnished units in central, well-connected locations",
          "Effort without a manager: moderate, with a few turnovers a year",
          "Furnishing: required",
        ],
      },
      {
        heading: "Short-term rentals (nightly stays)",
        paragraphs: [
          "Nightly rentals can earn the most in strong locations, but they come with the most work and the most rules. In Toronto, short-term rentals generally have to be in the host's principal residence and registered with the City, and many condo buildings restrict or ban them outright.",
        ],
        bullets: [
          "Best for: eligible properties in high-demand areas",
          "Effort without a manager: high, daily",
          "Furnishing: required, to a hotel standard",
        ],
      },
      {
        heading: "How to decide",
        paragraphs: [
          "Start with what's allowed: your condo declaration and rules, then the City's requirements. Then compare realistic net income, not just the headline rent, after furnishing, cleaning, utilities, vacancy and management. Finally, be honest about how much involvement you want.",
          "As part of our free assessment we run all three numbers for your unit, so you can choose with real figures in front of you.",
        ],
      },
    ],
  },
  {
    slug: "what-a-property-manager-does-for-long-term-rentals",
    title: "What a full-service property manager actually does for a long-term rental",
    excerpt: "Leasing is only the start. Here's everything that gets handled for you from listing day to move-out.",
    category: "Long-term rentals",
    date: "2026-11-09",
    readMinutes: 5,
    sections: [
      {
        paragraphs: [
          "Handing your property to a manager should mean you stop thinking about it day to day. Here's what that covers when we manage a long-term rental.",
        ],
      },
      {
        heading: "Before the tenant moves in",
        bullets: [
          "Rent pricing based on comparable units currently on the market",
          "Professional photos and a listing that reaches qualified renters",
          "Showings, so you never have to meet strangers at your unit",
          "Tenant screening: identity, income, employment, credit and references",
          "A lease on the Ontario Standard Lease form, completed correctly",
          "A documented move-in inspection with photos",
        ],
      },
      {
        heading: "While the tenant lives there",
        bullets: [
          "Rent collection and immediate follow-up on late payments",
          "A single point of contact for the tenant, so their calls don't come to you",
          "Maintenance and repairs, coordinated through our in-house Homev Construction team",
          "Periodic inspections, with proper written notice to the tenant",
          "Statements showing rent received and every expense",
        ],
      },
      {
        heading: "Renewals and move-outs",
        bullets: [
          "Lease renewals and rent increases, following Ontario's rules and notice periods",
          "Move-out inspection compared against the move-in record",
          "Turnover repairs, cleaning and re-leasing to keep vacancy short",
        ],
      },
      {
        heading: "When things go wrong",
        paragraphs: [
          "Most tenancies run smoothly with good screening. When they don't, we act early: we follow up on missed rent right away, serve the correct notices, and guide you through the Landlord and Tenant Board process, working with a licensed paralegal when a hearing is needed.",
        ],
      },
    ],
  },
  {
    slug: "how-we-screen-tenants",
    title: "How we screen tenants, and why it matters more than the rent",
    excerpt: "A few hundred dollars more in rent never makes up for the wrong tenant. This is the process we follow.",
    category: "Long-term rentals",
    date: "2026-11-09",
    readMinutes: 4,
    sections: [
      {
        paragraphs: [
          "In Ontario, removing a tenant who stops paying or damages a unit can take months. The most valuable thing a property manager does is choose the right tenant in the first place.",
        ],
      },
      {
        heading: "What we check",
        bullets: [
          "Identity: government ID that matches the application",
          "Income: pay stubs, an employment letter or other proof, compared against the rent",
          "Credit: a credit report, with consent, looking at payment history rather than just the score",
          "Rental history: references from current and previous landlords, not just the current one, who may want the tenant gone",
          "Employment: a call to confirm the role and the start date",
        ],
      },
      {
        heading: "Fair and consistent",
        paragraphs: [
          "Every applicant goes through the same steps and is judged on the same criteria. The Ontario Human Rights Code protects applicants from discrimination, and a consistent process protects you as the owner too.",
        ],
      },
      {
        heading: "Setting up the tenancy properly",
        paragraphs: [
          "Screening is only half of it. A correctly completed standard lease, a last month's rent deposit collected where appropriate, tenant insurance required, and a photo-documented move-in inspection give you a clear record if there's ever a dispute.",
        ],
      },
    ],
  },
  {
    slug: "furnished-mid-term-rentals-toronto",
    title: "Furnished mid-term rentals: the middle ground many Toronto owners overlook",
    excerpt: "Higher rent than a yearly lease, far less work than nightly guests, and allowed in more buildings.",
    category: "Mid-term rentals",
    date: "2026-11-09",
    readMinutes: 4,
    sections: [
      {
        paragraphs: [
          "Between a one-year lease and nightly guests sits a type of rental that suits many downtown condos: furnished stays of one to twelve months.",
        ],
      },
      {
        heading: "Who rents mid-term",
        bullets: [
          "Professionals on contracts or temporary assignments",
          "Doctors, nurses and medical residents on rotation",
          "Families relocating to Toronto or living elsewhere during a renovation",
          "Insurance placements after a fire or flood",
          "Students and visiting academics for a term",
        ],
      },
      {
        heading: "Why owners like it",
        bullets: [
          "Monthly rent above an unfurnished long-term lease",
          "Far fewer turnovers than nightly rentals, so less wear and less work",
          "Often allowed where short-term rentals aren't, because stays are 28 nights or more",
          "Flexibility to use the unit yourself or switch to a long-term lease later",
        ],
      },
      {
        heading: "What it takes",
        paragraphs: [
          "The unit has to be fully furnished and equipped, with utilities and internet set up, and kept to a high standard between stays. We handle the furnishing and setup, find and screen the occupants, and look after everything during their stay.",
        ],
      },
    ],
  },
  {
    slug: "toronto-short-term-rental-rules-condo-owners",
    title: "Thinking about short-term rentals in Toronto? Check these four things first",
    excerpt: "Before you list nightly, make sure your property is actually eligible. Here's the checklist.",
    category: "Short-term rentals",
    date: "2026-11-09",
    readMinutes: 4,
    sections: [
      {
        paragraphs: [
          "Nightly rentals can pay well, but they're also the most regulated way to rent a home in Toronto. Before you buy furniture or create a listing, check these four things.",
        ],
      },
      {
        heading: "1. Is it your principal residence?",
        paragraphs: [
          "Toronto's short-term rental bylaw generally allows nightly rentals only in the host's principal residence, the place where you actually live. An investment unit you don't live in usually doesn't qualify for stays under 28 nights.",
        ],
      },
      {
        heading: "2. Is it registered?",
        paragraphs: [
          "Short-term rental operators must register with the City and display their registration number on listings. There are also limits on how many nights a year an entire home can be rented. Check the City of Toronto's short-term rental page for the current rules, as they do change.",
        ],
      },
      {
        heading: "3. What does your condo allow?",
        paragraphs: [
          "Many condo corporations restrict short-term rentals in their declaration or rules, sometimes with a minimum stay length or a registration process for occupants. Read your building's documents and talk to management before you start.",
        ],
      },
      {
        heading: "4. Are your insurance and mortgage covered?",
        paragraphs: [
          "Standard home and condo insurance policies often exclude paid short-term guests. Confirm your coverage, and check whether your mortgage terms say anything about renting.",
        ],
      },
      {
        heading: "If short-term doesn't fit",
        paragraphs: [
          "If your property isn't eligible, a furnished mid-term rental (28 nights or more) or a well-managed long-term lease is often the better route. We'll tell you honestly which options are open to you.",
        ],
      },
    ],
  },
  {
    slug: "rent-ready-upgrades-that-pay-for-themselves",
    title: "Getting your property rent-ready: upgrades that pay for themselves",
    excerpt: "Small fixes before listing can mean higher rent, faster leasing and fewer repair calls later.",
    category: "Maintenance",
    date: "2026-11-09",
    readMinutes: 4,
    sections: [
      {
        paragraphs: [
          "Renters and guests decide in seconds from listing photos. A few targeted improvements before you list usually earn back their cost quickly, through higher rent and less time vacant.",
        ],
      },
      {
        heading: "High impact, low cost",
        bullets: [
          "Fresh, neutral paint throughout",
          "Bright, consistent LED lighting, including any burnt-out fixtures",
          "New caulking in kitchens and bathrooms",
          "Updated cabinet hardware, faucets and light switches",
          "A deep clean, including windows, vents and appliances",
        ],
      },
      {
        heading: "Worth it for longer holds",
        bullets: [
          "Durable flooring in place of worn carpet",
          "In-suite laundry if the space and building allow it",
          "Smart locks or keypad entry for easier access",
          "Quality window coverings for privacy and comfort",
        ],
      },
      {
        heading: "Fix before it breaks",
        paragraphs: [
          "Checking appliances, plumbing and smoke and CO alarms before a tenant moves in prevents emergency calls later. Because Homev Construction is part of our team, we can assess, quote and complete this work in one step, and keep it maintained afterwards.",
        ],
      },
    ],
  },
];

export function getArticle(slug) {
  return ARTICLES.find(article => article.slug === slug) || null;
}

export function getArticlesByCategory(category) {
  return ARTICLES.filter(article => article.category === category);
}

export function formatArticleDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}
