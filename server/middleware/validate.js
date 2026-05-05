/**
 * Zod validation middleware factory.
 * Usage: router.post('/route', validate(myZodSchema), handler)
 *
 * On failure: returns 400 with structured field errors.
 * On success: req.body is replaced with the parsed (coerced) Zod output.
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors
        });
    }
    req.body = result.data; // use coerced, validated data downstream
    next();
};

module.exports = validate;
