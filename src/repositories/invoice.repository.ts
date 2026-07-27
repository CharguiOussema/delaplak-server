import { InvoiceDocument, InvoiceModel } from '../models/invoice.model';
import BaseRepository from './base.repository';

class InvoiceRepository extends BaseRepository<InvoiceDocument> {
  constructor() {
    super(InvoiceModel);
  }

  countAll() {
    return this.model.countDocuments({});
  }
}

export const invoiceRepository = new InvoiceRepository();
