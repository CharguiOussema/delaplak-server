// Invoices have no bespoke query/body DTO: they are read-only (no create/update route —
// invoices are generated server-side inside order.service.confirm()), and the list
// endpoint takes no extra filters beyond page/limit/search, so invoice.route.ts validates
// GET /api/invoices directly against the shared PaginationQueryValidator
// (see ../../middlewares/validators/QueryValidator.ts) rather than a duplicate subclass.
export { PaginationQueryValidator as InvoiceQueryDto } from '../../middlewares/validators/QueryValidator';
