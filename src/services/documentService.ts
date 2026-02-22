import { supabase, getCurrentOrganization } from '../lib/supabase';

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
}

interface UploadDocumentInput {
  file: File;
  name: string;
  category: string;
  docType?: string;
  linkedDriverId?: string;
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
    linkedDriverId: row.linked_driver_id
  };
};

export const documentService = {
  async listDocuments(): Promise<AppDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('status', 'active')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Failed to list documents', error);
      throw error;
    }

    return (data || []).map(mapDocument);
  },

  async uploadDocument(input: UploadDocumentInput): Promise<AppDocument> {
    const orgId = await getCurrentOrganization();
    if (!orgId) {
      throw new Error('Organization context is required for document upload');
    }

    const fileName = sanitizeFileName(input.file.name);
    const storagePath = `${orgId}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(storagePath, input.file, {
        contentType: input.file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Failed to upload file to storage', uploadError);
      throw uploadError;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
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
        linked_driver_id: input.linkedDriverId || null
      }])
      .select()
      .single();

    if (error) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
      console.error('Failed to save document metadata', error);
      throw error;
    }

    return mapDocument(data);
  },

  async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      throw error ?? new Error('Could not create download URL');
    }

    return data.signedUrl;
  },

  async deleteDocument(document: AppDocument): Promise<void> {
    const { error: dbError } = await supabase
      .from('documents')
      .update({ status: 'archived' })
      .eq('id', document.id);

    if (dbError) {
      throw dbError;
    }

    const { error: storageError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .remove([document.storagePath]);

    if (storageError) {
      throw storageError;
    }
  }
};
