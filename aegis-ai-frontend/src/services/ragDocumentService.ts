import axios from "axios";

import { httpClient } from "../api/httpClient";


export type RAGDocumentStatus =
  | "Pending"
  | "Processing"
  | "Ready"
  | "Failed";


export interface RAGDocument {
  id: string;
  uploaded_by_user_id: string | null;

  original_filename: string;
  content_type: string;
  file_size_bytes: number;

  checksum_sha256: string;
  status: RAGDocumentStatus;

  page_count: number | null;
  chunk_count: number;
  error_message: string | null;

  processed_at: string | null;
  created_at: string;
  updated_at: string;
}


export interface RAGDocumentListResponse {
  documents: RAGDocument[];
  total: number;
}


export interface RAGDocumentUploadResponse {
  message: string;
  document: RAGDocument;
}


export interface RAGDocumentChunk {
  id: string;
  document_id: string;

  chunk_index: number;
  page_number: number | null;

  content: string;
  character_count: number;
  token_count: number | null;

  chunk_metadata: Record<string, unknown>;
  created_at: string;
}


export interface RAGSource {
  chunk: RAGDocumentChunk;
  similarity: number;
  cosine_distance: number;
}


export interface RAGAnswerRequest {
  question: string;
  top_k?: number;
  document_id?: string | null;
}


export interface RAGAnswerResponse {
  question: string;
  answer: string;
  sources: RAGSource[];
  total_sources: number;
}


interface BackendErrorResponse {
  detail?:
    | string
    | Array<{
        msg?: string;
      }>;
}


export async function listRAGDocuments(): Promise<
  RAGDocumentListResponse
> {
  const response =
    await httpClient.get<RAGDocumentListResponse>(
      "/rag/documents",
    );

  return response.data;
}


export async function uploadRAGDocument(
  file: File,
): Promise<RAGDocumentUploadResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const response =
    await httpClient.post<RAGDocumentUploadResponse>(
      "/rag/documents/upload",
      formData,
      {
        timeout: 120000,
      },
    );

  return response.data;
}


export async function processRAGDocument(
  documentId: string,
): Promise<RAGDocument> {
  const response = await httpClient.post<RAGDocument>(
    `/rag/documents/${documentId}/process`,
    undefined,
    {
      timeout: 300000,
    },
  );

  return response.data;
}


export async function answerRAGQuestion(
  request: RAGAnswerRequest,
): Promise<RAGAnswerResponse> {
  const response =
    await httpClient.post<RAGAnswerResponse>(
      "/rag/documents/answer",
      {
        question: request.question,
        top_k: request.top_k ?? 5,
        document_id: request.document_id ?? null,
      },
      {
        timeout: 300000,
      },
    );

  return response.data;
}


export async function deleteRAGDocument(
  documentId: string,
): Promise<void> {
  await httpClient.delete(
    `/rag/documents/${documentId}`,
  );
}


export function getRAGErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    if (!error.response) {
      return (
        "Unable to connect to the AEGIS AI backend. " +
        "Confirm that FastAPI and Ollama are running."
      );
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return (
        detail[0]?.msg ??
        "The document request was invalid."
      );
    }

    if (error.response.status === 401) {
      return "Your session has expired. Sign in again.";
    }

    if (error.response.status === 409) {
      return "This document has already been uploaded.";
    }

    if (error.response.status === 422) {
      return "The selected document is not supported.";
    }

    return "The document assistant request failed.";
  }

  return "An unexpected document assistant error occurred.";
}
