// Default contact details, used when the admin Site Settings fields are empty
export const CONTACT_EMAIL = "farshad@homevsuites.com";
export const CONTACT_PHONE = "(365) 351-4030";
export const CONTACT_ADDRESS = "155 Yorkville Ave, Toronto, ON";

// tel: links need digits only
export const telHref = (phone) => `tel:+1${phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "")}`;
