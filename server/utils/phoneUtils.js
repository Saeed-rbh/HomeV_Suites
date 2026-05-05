/**
 * Normalizes a phone number to E.164 format (+1XXXXXXXXXX for North American numbers).
 * Returns the input unchanged if it looks like an email or is empty.
 */
const normalizePhone = (p) => {
    if (!p || p.includes('@')) return p;
    let d = p.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) d = d.substring(1);
    return `+1${d}`;
};

module.exports = { normalizePhone };
