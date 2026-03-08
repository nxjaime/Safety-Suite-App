import { supabase, getCurrentOrganization } from '../lib/supabase';
import { withRetry } from './retry';

const DOCUMENT_BUCKET = 'compliance-documents';

export interface AppDocument {
  id: string;
  name: string;
  category: string;
  docType?: string;
  fileSize?: number;
  mimeType?: string;
  storagePath: string;
  uploadedAt: string;
  uploadedBy?: string;
  linkedDriverId?: string;
  linkedEquipmentId?: string;
  metadata?: Record<string, unknown>;
}

interface UploadDocumentInput {
  file: File;
  name: string;
  category: string;
  docType?: string;
  linkedDriverId?: string;
  linkedEquipmentId?: string;
  metadata?: Record<string, unknown>;
}

interface BulkArchiveResult {
  archived: number;
  failedIds: string[];
}

interface BulkUploadInput {
  files: File[];
  category: string;
  docType?: string;
  linkedDriverId?: string;
  metadata?: Record<string, unknown>;
}

interface BulkUploadResult {
  uploaded: AppDocument[];
  failedFiles: string[];
}

interface BulkUpdateInput {
  documentIds: string[];
  category?: string;
  docType?: string;
  metadata?: Record<string, unknown>;
}

interface BulkUpdateResult {
  updated: number;
  failedIds: string[];
}

const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '-');
};

const mapDocument = (row: any): AppDocument => {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    docType: row.doc_type,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    linkedDriverId: row.linked_driver_id,
    linkedEquipmentId: row.linked_equipment_id,
    metadata: row.metadata || {}
  };
};

export const documentService = {
  async listDocuments(): Promise<AppDocument[]> {
    return withRetry(async () => {
      const orgId = await getCurrentOrganization();
      let query = supabase
        .from('documents')
        .select('*')
        .eq('status', 'active');
      if (orgId) {
        query = query.eq('organization_id', orgId);
      }
      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Failed to list documents', error);
        throw error;
      }

      return (data || []).map(mapDocument);
    });
  },

  async uploadDocument(input: UploadDocumentInput): Promise<AppDocument> {
    const orgId = await getCurrentOrganization();
    if (!orgId) {
      throw new Error('Organization context is required for document upload');
    }

    const fileName = sanitizeFileName(input.file.name);
    const storagePath = `${orgId}/${Date.now()}-${fileName}`;

    const uploadResult = await withRetry(async () => {
      return supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(storagePath, input.file, {
          contentType: input.file.type,
          upsert: false
        });
    });
    const uploadError = uploadResult.error;

    if (uploadError) {
      console.error('Failed to upload file to storage', uploadError);
      throw uploadError;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await withRetry(async () => {
      return supabase
        .from('documents')
        .insert([{
          organization_id: orgId,
          name: input.name,
          category: input.category,
          doc_type: input.docType || null,
          file_size: input.file.size,
          mime_type: input.file.type || null,
          storage_bucket: DOCUMENT_BUCKET,
          storage_path: storagePath,
          uploaded_by: userData.user?.id || null,
          linked_driver_id: input.linkedDriverId || null,
          linked_equipment_id: input.linkedEquipmentId || null,
          metadata: input.metadata || {}
        }])
        .select()
        .single();
    });

    if (error) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
      console.error('Failed to save document metadata', error);
      throw error;
    }

    return mapDocument(data);
  },

  async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await withRetry(async () => {
      return supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(storagePath, 60);
    });

    if (error || !data?.signedUrl) {
      throw error ?? new Error('Could not create download URL');
    }

    return data.signedUrl;
  },

  async deleteDocument(document: AppDocument): Promise<void> {
    const orgId = await getCurrentOrganization();
    const { error: dbError } = await withRetry(async () => {
      let query = supabase
        .from('documents')
        .update({ status: 'archived' })
        .eq('id', document.id);

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      return query;
    });

    if (dbError) {
      throw dbError;
    }

    const { error: storageError } = await withRetry(async () => {
      return supabase.storage
        .from(DOCUMENT_BUCKET)
        .remove([document.storagePath]);
    });

    if (storageError) {
      throw storageError;
    }
  },

  async bulkArchiveDocuments(documents: AppDocument[]): Promise<BulkArchiveResult> {
    let archived = 0;
    const failedIds: string[] = [];

    for (const doc of documents) {
      try {
        await this.deleteDocument(doc);
        archived += 1;
      } catch (error) {
        console.error(`Failed to archive document ${doc.id}`, error);
        failedIds.push(doc.id);
      }
    }

    return { archived, failedIds };
  },

  async uploadDocumentsBulk(input: BulkUploadInput): Promise<BulkUploadResult> {
    const uploaded: AppDocument[] = [];
    const failedFiles: string[] = [];

    for (const file of input.files) {
      try {
        const saved = await this.uploadDocument({
          file,
          name: file.name,
          category: input.category,
          docType: input.docType,
          linkedDriverId: input.linkedDriverId,
          metadata: input.metadata
        });
        uploaded.push(saved);
      } catch (error) {
        console.error(`Failed to bulk upload file ${file.name}`, error);
        failedFiles.push(file.name);
      }
    }

    return { uploaded, failedFiles };
  },

  async bulkUpdateDocuments(input: BulkUpdateInput): Promise<BulkUpdateResult> {
    const orgId = await getCurrentOrganization();
    const updatePayload: Record<string, unknown> = {};
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.docType !== undefined) updatePayload.doc_type = input.docType;
    if (input.metadata !== undefined) updatePayload.metadata = input.metadata;

    if (Object.keys(updatePayload).length === 0 || input.documentIds.length === 0) {
      return { updated: 0, failedIds: [] };
    }

    let updated = 0;
    const failedIds: string[] = [];

    for (const documentId of input.documentIds) {
      const { error } = await withRetry(async () => {
        let query = supabase
          .from('documents')
          .update(updatePayload)
          .eq('id', documentId);

        if (orgId) {
          query = query.eq('organization_id', orgId);
        }

        return query;
      });

      if (error) {
        console.error(`Failed to bulk update document ${documentId}`, error);
        failedIds.push(documentId);
      } else {
        updated += 1;
      }
    }

    return { updated, failedIds };
  },

  /** Documents expiring within `daysOut` days (have expirationDate in metadata) */
  getExpiringDocuments(docs: AppDocument[], daysOut = 30, todayISO = new Date().toISOString().split('T')[0]): AppDocument[] {
    const cutoff = new Date(todayISO);
    cutoff.setDate(cutoff.getDate() + daysOut);
    const cutoffISO = cutoff.toISOString().split('T')[0];
    return docs.filter(doc => {
      const exp = String((doc.metadata || {}).expirationDate || '');
      return exp && exp >= todayISO && exp <= cutoffISO;
    });
  },

  /** Documents already past their expiration date */
  getExpiredDocuments(docs: AppDocument[], todayISO = new Date().toISOString().split('T')[0]): AppDocument[] {
    return docs.filter(doc => {
      const exp = String((doc.metadata || {}).expirationDate || '');
      return exp && exp < todayISO;
    });
  },

  /** Documents marked as required (metadata.required === true) that are expired or missing */
  getDocumentDeficiencies(
    docs: AppDocument[],
    todayISO = new Date().toISOString().split('T')[0]
  ): { doc: AppDocument; reason: 'expired' | 'missing_expiry' }[] {
    const result: { doc: AppDocument; reason: 'expired' | 'missing_expiry' }[] = [];
    for (const doc of docs) {
      if ((doc.metadata || {}).required !== true) continue;
      const exp = String((doc.metadata || {}).expirationDate || '');
      if (!exp) { result.push({ doc, reason: 'missing_expiry' }); }
      else if (exp < todayISO) { result.push({ doc, reason: 'expired' }); }
    }
    return result;
  },
};
