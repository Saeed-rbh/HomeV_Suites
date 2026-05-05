/**
 * Parses a JSON:API `included` array into typed lookup maps.
 * Used by both getProperties() and getPropertyById() to eliminate duplication.
 *
 * @param {Array} included - The `included` array from an Uplisting API response
 * @returns {Object} Named lookup maps keyed by resource ID
 */
const parseUplistingIncludes = (included = []) => {
    const addressMap        = {};
    const photoMap          = {};
    const amenityMap        = {};
    const policyMap         = {};
    const discountMap       = {};
    const feeMap            = {};
    const taxMap            = {};
    const suitabilityMap    = {};
    const securityDepositMap = {};
    const commissionMap     = {};

    for (const inc of included) {
        switch (inc.type) {
            case 'addresses':
                addressMap[inc.id] = inc.attributes;
                break;
            case 'photos':
                photoMap[inc.id] = inc.attributes;
                break;
            case 'amenities':
                amenityMap[inc.id] = {
                    id:    inc.id,
                    name:  inc.attributes.name,
                    group: inc.attributes.group || inc.attributes.category_name || 'Amenities'
                };
                break;
            case 'policies':
                policyMap[inc.id] = inc.attributes;
                break;
            case 'property_discounts':
                discountMap[inc.id] = inc.attributes;
                break;
            case 'property_fees':
                feeMap[inc.id] = inc.attributes;
                break;
            case 'property_taxes':
                taxMap[inc.id] = inc.attributes;
                break;
            case 'suitabilities':
                suitabilityMap[inc.id] = inc.attributes;
                break;
            case 'protect_security_deposit_settings':
                securityDepositMap[inc.id] = inc.attributes;
                break;
            case 'channel_commissions':
                commissionMap[inc.id] = inc.attributes;
                break;
            default:
                break;
        }
    }

    return {
        addressMap,
        photoMap,
        amenityMap,
        policyMap,
        discountMap,
        feeMap,
        taxMap,
        suitabilityMap,
        securityDepositMap,
        commissionMap,
    };
};

/**
 * Builds a full address string from a parsed address attributes object.
 */
const buildAddress = (addrData) => {
    if (!addrData) return 'Toronto, ON';
    return `${addrData.street || ''}${addrData.suite ? ' ' + addrData.suite : ''}, ${addrData.city || ''}, ${addrData.state || ''} ${addrData.zip_code || ''}, ${addrData.country || ''}`;
};

/**
 * Maps cancellation policy from Uplisting policy attributes.
 */
const mapCancellationPolicy = (pol) => {
    if (!pol) return { cancellationType: 'Moderate cancellation policy', cancellationDescription: 'Cancel before the deadline for a full refund.', cancellationDays: 5 };
    let cancellationDays = 5;
    const type = pol.type || 'Moderate cancellation policy';
    const description = pol.description || 'Cancel before the deadline for a full refund.';
    const match = description?.match(/(\d+) days/);
    if (match) cancellationDays = parseInt(match[1]);
    else if (type.toLowerCase().includes('strict')) cancellationDays = 14;
    else if (type.toLowerCase().includes('flexible')) cancellationDays = 1;
    return { cancellationType: type, cancellationDescription: description, cancellationDays };
};

module.exports = { parseUplistingIncludes, buildAddress, mapCancellationPolicy };
