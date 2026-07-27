import { invoiceRepository } from '../repositories';
import { NotFoundError, ForbiddenError } from '../errors';
import { paginate } from '../helpers';
import { InvoiceModel, InvoiceLine } from '../models/invoice.model';
import { OrderDocument } from '../models/order.model';
import { UserDocument } from '../models/user.model';
import { USER_ROLES } from '../types/consts';
import { generateInvoicePdf } from './pdf.service';

async function nextInvoiceNumber(): Promise<string> {
  const count = await invoiceRepository.countAll();
  return `INV-${String(count + 1).padStart(6, '0')}`;
}

export async function generateForOrder(order: OrderDocument, clientEmail: string) {
  const number = await nextInvoiceNumber();

  const lines: InvoiceLine[] = order.items.map((item) => ({
    description: item.name.en,
    quantity: item.quantity,
    unitPrice: item.price,
    lineTotal: item.price * item.quantity,
  }));

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = subtotal;
  const issuedAt = new Date();

  const { relativePath } = await generateInvoicePdf({
    number,
    issuedAt,
    client: { email: clientEmail },
    lines,
    subtotal,
    total,
  });

  return invoiceRepository.create({
    order: order._id,
    client: order.client,
    number,
    lines,
    subtotal,
    total,
    pdfPath: relativePath,
    issuedAt,
  } as any);
}

function assertOwnershipOrStaff(currentUser: UserDocument, ownerId: any) {
  const isStaff = currentUser.role === USER_ROLES.ADMIN;
  if (!isStaff && ownerId.toString() !== currentUser._id.toString()) {
    throw new ForbiddenError('You may only access your own invoices', 'invoice.service.assertOwnershipOrStaff');
  }
}

export async function getAll({
  page,
  limit,
  currentUser,
}: {
  page: number;
  limit: number;
  currentUser: UserDocument;
}) {
  const isStaff = currentUser.role === USER_ROLES.ADMIN;
  const filter: Record<string, any> = { isDeleted: false };
  if (!isStaff) filter.client = currentUser._id;
  return paginate(InvoiceModel, filter, { page, limit, populate: 'client order' });
}

export async function getById({ id, currentUser }: { id: string; currentUser: UserDocument }) {
  const invoice = await invoiceRepository.getOne({ _id: id, isDeleted: false });
  if (!invoice) {
    throw new NotFoundError('Invoice not found', 'invoice.service.getById');
  }
  // Ownership must be checked against the raw ObjectId, before `.populate()` replaces
  // `invoice.client` with a hydrated User document (whose own .toString() is not its id).
  assertOwnershipOrStaff(currentUser, invoice.client);
  await invoice.populate('client order');
  return invoice;
}
