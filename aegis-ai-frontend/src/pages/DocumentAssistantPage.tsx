import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

import { DocumentCard } from "../components/documents/DocumentCard";

import {
  answerRAGQuestion,
  getRAGErrorMessage,
  listRAGDocuments,
  processRAGDocument,
  uploadRAGDocument,
  type RAGDocument,
  type RAGSource,
} from "../services/ragDocumentService";


const MAX_FILE_SIZE = 20 * 1024 * 1024;


function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}


function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}


function getFileType(document: RAGDocument): string {
  const filename = document.original_filename.toLowerCase();

  if (filename.endsWith(".pdf")) {
    return "PDF";
  }

  if (filename.endsWith(".md")) {
    return "Markdown";
  }

  return "Text";
}


function getDocumentDetails(document: RAGDocument): string {
  const fileType = getFileType(document);
  const fileSize = formatFileSize(
    document.file_size_bytes,
  );

  const chunkText =
    document.chunk_count === 1
      ? "1 chunk"
      : `${document.chunk_count} chunks`;

  return `${fileType} • ${fileSize} • ${chunkText}`;
}


export function DocumentAssistantPage() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<
    RAGDocument[]
  >([]);

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] = useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [question, setQuestion] = useState("");

  const [answer, setAnswer] = useState(
    "Select a ready document and ask a question.",
  );

  const [sources, setSources] = useState<
    RAGSource[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isAsking, setIsAsking] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  const selectedDocument = useMemo(
    () =>
      documents.find(
        (document) =>
          document.id === selectedDocumentId,
      ) ?? null,
    [documents, selectedDocumentId],
  );


  async function loadDocuments(): Promise<void> {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response =
        await listRAGDocuments();

      setDocuments(response.documents);

      setSelectedDocumentId(
        (currentDocumentId) => {
          const currentDocumentStillExists =
            response.documents.some(
              (document) =>
                document.id === currentDocumentId,
            );

          if (currentDocumentStillExists) {
            return currentDocumentId;
          }

          return response.documents[0]?.id ?? "";
        },
      );
    } catch (error) {
      setErrorMessage(
        getRAGErrorMessage(error),
      );
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    void loadDocuments();
  }, []);


  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    setErrorMessage("");
    setSuccessMessage("");

    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const supportedFile =
      /\.(pdf|txt|md)$/i.test(file.name);

    if (!supportedFile) {
      setSelectedFile(null);
      setErrorMessage(
        "Select a PDF, TXT, or Markdown file.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setErrorMessage(
        "The selected file must be 20 MB or smaller.",
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }


  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage(
        "Select a document before uploading.",
      );
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setSources([]);

    try {
      const uploadResult =
        await uploadRAGDocument(selectedFile);

      const uploadedDocument =
        uploadResult.document;

      setDocuments((currentDocuments) => [
        uploadedDocument,
        ...currentDocuments.filter(
          (document) =>
            document.id !== uploadedDocument.id,
        ),
      ]);

      setSelectedDocumentId(
        uploadedDocument.id,
      );

      setAnswer(
        `"${uploadedDocument.original_filename}" was uploaded. Ollama is processing and embedding the document.`,
      );

      const processingDocument: RAGDocument = {
        ...uploadedDocument,
        status: "Processing",
      };

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === processingDocument.id
            ? processingDocument
            : document,
        ),
      );

      const processedDocument =
        await processRAGDocument(
          uploadedDocument.id,
        );

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === processedDocument.id
            ? processedDocument
            : document,
        ),
      );

      setAnswer(
        `"${processedDocument.original_filename}" is ready. Ask a question about its content.`,
      );

      setSuccessMessage(
        "Document uploaded, chunked, embedded, and added to the knowledge base.",
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setErrorMessage(
        getRAGErrorMessage(error),
      );

      await loadDocuments();
    } finally {
      setIsUploading(false);
    }
  }


  async function handleAskQuestion(): Promise<void> {
    const normalizedQuestion =
      question.trim();

    if (!normalizedQuestion) {
      return;
    }

    if (!selectedDocument) {
      setErrorMessage(
        "Select a document first.",
      );
      return;
    }

    if (selectedDocument.status !== "Ready") {
      setErrorMessage(
        "The selected document is not ready yet.",
      );
      return;
    }

    setIsAsking(true);
    setErrorMessage("");
    setSuccessMessage("");
    setSources([]);

    try {
      const response =
        await answerRAGQuestion({
          question: normalizedQuestion,
          top_k: 5,
          document_id: selectedDocument.id,
        });

      setAnswer(response.answer);
      setSources(response.sources);
    } catch (error) {
      setErrorMessage(
        getRAGErrorMessage(error),
      );
    } finally {
      setIsAsking(false);
    }
  }


  return (
    <Stack spacing={4}>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            AI Document Assistant
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1,
            }}
          >
            Upload industrial documents and ask
            grounded questions using local Ollama,
            PostgreSQL, and pgvector.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          disabled={isLoading}
          onClick={() => {
            void loadDocuments();
          }}
        >
          Refresh documents
        </Button>
      </Stack>

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => {
            setErrorMessage("");
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          onClose={() => {
            setSuccessMessage("");
          }}
        >
          {successMessage}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "360px minmax(0, 1fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Card
          sx={{
            backgroundImage: "none",
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {isUploading && <LinearProgress />}

          <CardContent>
            <Stack
              component="form"
              spacing={2.5}
              onSubmit={(event) => {
                void handleUpload(event);
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                }}
              >
                <UploadFileRoundedIcon
                  color="primary"
                />

                <Typography
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Upload document
                </Typography>
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                }}
              >
                Upload an industrial manual, SOP,
                safety procedure, or maintenance guide.
              </Typography>

              <Button
                component="label"
                variant="outlined"
                startIcon={
                  <UploadFileRoundedIcon />
                }
                disabled={isUploading}
                sx={{
                  minHeight: 48,
                  justifyContent: "flex-start",
                  overflow: "hidden",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedFile?.name ??
                    "Choose PDF, TXT, or Markdown"}
                </Box>

                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                />
              </Button>

              {selectedFile && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {formatFileSize(
                    selectedFile.size,
                  )}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={
                  !selectedFile ||
                  isUploading
                }
                startIcon={
                  isUploading ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <UploadFileRoundedIcon />
                  )
                }
              >
                {isUploading
                  ? "Uploading and processing"
                  : "Upload to knowledge base"}
              </Button>

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Supported formats: PDF, TXT, and
                Markdown. Maximum size: 20 MB.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={3}>
          <Card
            sx={{
              backgroundImage: "none",
              backgroundColor:
                "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {isLoading && <LinearProgress />}

            <CardContent>
              <Stack spacing={2.5}>
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={1}
                  sx={{
                    justifyContent:
                      "space-between",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <LibraryBooksRoundedIcon
                      color="primary"
                    />

                    <Typography
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Knowledge base
                    </Typography>
                  </Stack>

                  <Chip
                    label={`${documents.length} documents`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Divider />

                {!isLoading &&
                  documents.length === 0 && (
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          "text.secondary",
                      }}
                    >
                      No documents have been
                      uploaded yet.
                    </Typography>
                  )}

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      lg: "repeat(2, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  {documents.map((document) => (
                    <DocumentCard
                      key={document.id}
                      title={
                        document.original_filename
                      }
                      status={document.status}
                      details={getDocumentDetails(
                        document,
                      )}
                      uploadedAt={formatDate(
                        document.created_at,
                      )}
                      selected={
                        selectedDocumentId ===
                        document.id
                      }
                      onSelect={() => {
                        setSelectedDocumentId(
                          document.id,
                        );

                        setSources([]);

                        setAnswer(
                          document.status ===
                            "Ready"
                            ? `"${document.original_filename}" is selected. Ask a question about it.`
                            : `"${document.original_filename}" currently has status: ${document.status}.`,
                        );
                      }}
                    />
                  ))}
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundImage: "none",
              backgroundColor:
                "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {isAsking && <LinearProgress />}

            <CardContent>
              <Stack spacing={2.5}>
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={1}
                  sx={{
                    justifyContent:
                      "space-between",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <AutoAwesomeRoundedIcon
                      color="secondary"
                    />

                    <Typography
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Ask the selected document
                    </Typography>
                  </Stack>

                  <Chip
                    label={
                      selectedDocument
                        ? selectedDocument
                            .original_filename
                        : "No document selected"
                    }
                    color="secondary"
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Question"
                  placeholder="For example: What should workers do before machine maintenance?"
                  value={question}
                  disabled={
                    isAsking ||
                    selectedDocument?.status !==
                      "Ready"
                  }
                  onChange={(event) => {
                    setQuestion(
                      event.target.value,
                    );
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={
                    isAsking ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    ) : (
                      <SearchRoundedIcon />
                    )
                  }
                  onClick={() => {
                    void handleAskQuestion();
                  }}
                  disabled={
                    !question.trim() ||
                    !selectedDocument ||
                    selectedDocument.status !==
                      "Ready" ||
                    isAsking
                  }
                  sx={{
                    alignSelf: "flex-start",
                  }}
                >
                  {isAsking
                    ? "Generating answer"
                    : "Ask document"}
                </Button>

                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor:
                      "rgba(255, 255, 255, 0.025)",
                  }}
                >
                  <Stack spacing={2}>
                    <Chip
                      label="Local RAG • Ollama • pgvector"
                      color="primary"
                      size="small"
                      variant="outlined"
                      sx={{
                        alignSelf: "flex-start",
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.8,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {answer}
                    </Typography>

                    {sources.length > 0 && (
                      <>
                        <Divider />

                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                          }}
                        >
                          Sources
                        </Typography>

                        {sources.map(
                          (source, index) => (
                            <Box
                              key={
                                source.chunk.id
                              }
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border:
                                  "1px solid",
                                borderColor:
                                  "divider",
                              }}
                            >
                              <Stack
                                spacing={1}
                              >
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{
                                    alignItems:
                                      "center",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  <Chip
                                    label={`Source ${
                                      index + 1
                                    }`}
                                    size="small"
                                    color="secondary"
                                  />

                                  <Chip
                                    label={`${(
                                      source.similarity *
                                      100
                                    ).toFixed(
                                      1,
                                    )}% similarity`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Stack>

                                <Typography
                                  variant="body2"
                                  sx={{
                                    color:
                                      "text.secondary",
                                    whiteSpace:
                                      "pre-line",
                                  }}
                                >
                                  {
                                    source.chunk
                                      .content
                                  }
                                </Typography>
                              </Stack>
                            </Box>
                          ),
                        )}
                      </>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}
