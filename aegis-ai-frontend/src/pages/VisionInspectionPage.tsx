import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { MetricCard } from "../components/dashboard/MetricCard";
import { VisionInspectionCard } from "../components/vision/VisionInspectionCard";

import {
  getMachines,
  type Machine,
} from "../services/machineService";

import {
  createVisionInspection,
  getVisionErrorMessage,
  getVisionInspectionImage,
  listVisionInspections,
  type VisionInspection,
  type VisionInspectionResult,
} from "../services/visionInspectionService";


type InspectionFilter =
  | "All"
  | VisionInspectionResult;


const filters: InspectionFilter[] = [
  "All",
  "Pass",
  "Defect",
  "Review",
];


function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}


export function VisionInspectionPage() {
  const [inspections, setInspections] = useState<
    VisionInspection[]
  >([]);

  const [machines, setMachines] = useState<
    Machine[]
  >([]);

  const [imageUrls, setImageUrls] = useState<
    Record<string, string>
  >({});

  const imageUrlsRef = useRef<
    Record<string, string>
  >({});

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [selectedFilter, setSelectedFilter] =
    useState<InspectionFilter>("All");

  const [searchText, setSearchText] =
    useState("");

  const deferredSearchText =
    useDeferredValue(searchText);

  const [isDialogOpen, setIsDialogOpen] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [productName, setProductName] =
    useState("");

  const [machineId, setMachineId] =
    useState("");

  const [camera, setCamera] =
    useState("");

  const [zone, setZone] =
    useState("");

  const [inspectionContext, setInspectionContext] =
    useState("");


  const revokeImageUrls = useCallback(() => {
    Object.values(
      imageUrlsRef.current,
    ).forEach((url) => {
      URL.revokeObjectURL(url);
    });

    imageUrlsRef.current = {};
  }, []);


  const loadInspections = useCallback(
    async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response =
          await listVisionInspections({
            limit: 100,
          });

        const loadedImageEntries:
          Array<[string, string] | null> =
          await Promise.all(
            response.inspections.map(
              async (inspection) => {
                try {
                  const imageBlob =
                    await getVisionInspectionImage(
                      inspection.id,
                    );

                  return [
                    inspection.id,
                    URL.createObjectURL(
                      imageBlob,
                    ),
                  ];
                } catch {
                  return null;
                }
              },
            ),
          );

        const nextImageUrls =
          Object.fromEntries(
            loadedImageEntries.filter(
              (
                entry,
              ): entry is [string, string] =>
                entry !== null,
            ),
          );

        revokeImageUrls();

        imageUrlsRef.current =
          nextImageUrls;

        setImageUrls(nextImageUrls);
        setInspections(
          response.inspections,
        );
      } catch (error) {
        setErrorMessage(
          getVisionErrorMessage(error),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [revokeImageUrls],
  );


  useEffect(() => {
    void loadInspections();

    return () => {
      revokeImageUrls();
    };
  }, [
    loadInspections,
    revokeImageUrls,
  ]);


  useEffect(() => {
    async function loadMachines(): Promise<void> {
      try {
        const response = await getMachines({
          limit: 200,
        });

        setMachines(response.machines);
      } catch {
        setMachines([]);
      }
    }

    void loadMachines();
  }, []);


  const filteredInspections = useMemo(() => {
    const normalizedSearch =
      deferredSearchText
        .trim()
        .toLowerCase();

    return inspections.filter(
      (inspection) => {
        const matchesFilter =
          selectedFilter === "All" ||
          inspection.result ===
            selectedFilter;

        const searchableText = [
          inspection.product_name,
          inspection.inspection_code,
          inspection.camera ?? "",
          inspection.zone ?? "",
          inspection.finding ?? "",
          inspection.defect_type ?? "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          searchableText.includes(
            normalizedSearch,
          );

        return (
          matchesFilter &&
          matchesSearch
        );
      },
    );
  }, [
    deferredSearchText,
    inspections,
    selectedFilter,
  ]);


  const passedCount = inspections.filter(
    (inspection) =>
      inspection.result === "Pass",
  ).length;

  const defectCount = inspections.filter(
    (inspection) =>
      inspection.result === "Defect",
  ).length;

  const reviewCount = inspections.filter(
    (inspection) =>
      inspection.result === "Review",
  ).length;

  const confidenceValues = inspections
    .map(
      (inspection) =>
        inspection.confidence,
    )
    .filter(
      (value): value is number =>
        value !== null,
    );

  const averageConfidence =
    confidenceValues.length > 0
      ? Math.round(
          confidenceValues.reduce(
            (total, value) =>
              total + value,
            0,
          ) /
            confidenceValues.length,
        )
      : 0;


  function resetForm(): void {
    setSelectedFile(null);
    setProductName("");
    setMachineId("");
    setCamera("");
    setZone("");
    setInspectionContext("");
  }


  async function handleSubmitInspection(): Promise<void> {
    if (!selectedFile) {
      setErrorMessage(
        "Select a JPEG, PNG, or WebP image.",
      );

      return;
    }

    if (!productName.trim()) {
      setErrorMessage(
        "Enter the product or asset name.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const inspection =
        await createVisionInspection({
          file: selectedFile,
          productName,
          machineId:
            machineId || null,
          camera: camera || null,
          zone: zone || null,
          inspectionContext:
            inspectionContext || null,
        });

      setSuccessMessage(
        `${inspection.inspection_code} completed with result ${inspection.result ?? inspection.status}.`,
      );

      setIsDialogOpen(false);
      resetForm();

      await loadInspections();
    } catch (error) {
      setErrorMessage(
        getVisionErrorMessage(error),
      );
    } finally {
      setIsSubmitting(false);
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
          justifyContent:
            "space-between",
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
            Vision Inspection
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mt: 1,
            }}
          >
            Run local AI-powered visual
            inspections and review stored
            quality-control results.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            <CameraAltRoundedIcon />
          }
          onClick={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setIsDialogOpen(true);
          }}
        >
          Run New Inspection
        </Button>
      </Stack>

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() =>
            setErrorMessage(null)
          }
        >
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          onClose={() =>
            setSuccessMessage(null)
          }
        >
          {successMessage}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 3,
        }}
      >
        <MetricCard
          title="Passed Inspections"
          value={String(passedCount)}
          description="Images with no visible defect"
          icon={
            <CheckCircleRoundedIcon />
          }
          iconBackground="rgba(39,174,96,0.14)"
          iconColor="#27ae60"
        />

        <MetricCard
          title="Detected Defects"
          value={String(defectCount)}
          description="Visible issues requiring action"
          icon={<ErrorRoundedIcon />}
          iconBackground="rgba(235,87,87,0.14)"
          iconColor="#eb5757"
        />

        <MetricCard
          title="Manual Review"
          value={String(reviewCount)}
          description="Images requiring human validation"
          icon={
            <VisibilityRoundedIcon />
          }
          iconBackground="rgba(242,201,76,0.14)"
          iconColor="#f2c94c"
        />

        <MetricCard
          title="AI Confidence"
          value={`${averageConfidence}%`}
          description="Average model confidence"
          icon={
            <CameraAltRoundedIcon />
          }
          iconBackground="rgba(47,128,237,0.14)"
          iconColor="#56a0ff"
        />
      </Box>

      <Stack spacing={2}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          sx={{
            justifyContent:
              "space-between",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              flexWrap: "wrap",
            }}
          >
            {filters.map((filter) => (
              <Chip
                key={filter}
                label={filter}
                clickable
                color={
                  selectedFilter === filter
                    ? "primary"
                    : "default"
                }
                variant={
                  selectedFilter === filter
                    ? "filled"
                    : "outlined"
                }
                onClick={() =>
                  setSelectedFilter(filter)
                }
              />
            ))}
          </Stack>

          <TextField
            size="small"
            placeholder="Search inspections..."
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value,
              )
            }
            sx={{
              width: {
                xs: "100%",
                md: 330,
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          Showing{" "}
          {filteredInspections.length} of{" "}
          {inspections.length} inspections
        </Typography>
      </Stack>

      {isLoading ? (
        <Box
          sx={{
            minHeight: 260,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
            }}
          >
            <CircularProgress />

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              Loading inspections...
            </Typography>
          </Stack>
        </Box>
      ) : filteredInspections.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {filteredInspections.map(
            (inspection) => (
              <VisionInspectionCard
                key={inspection.id}
                inspectionId={
                  inspection.inspection_code
                }
                productName={
                  inspection.product_name
                }
                camera={inspection.camera}
                zone={inspection.zone}
                detectedAt={formatDateTime(
                  inspection.created_at,
                )}
                finding={
                  inspection.finding
                }
                confidence={
                  inspection.confidence
                }
                result={inspection.result}
                severity={
                  inspection.severity
                }
                status={inspection.status}
                defectType={
                  inspection.defect_type
                }
                recommendedAction={
                  inspection.recommended_action
                }
                analysisDurationMs={
                  inspection.analysis_duration_ms
                }
                imageUrl={
                  imageUrls[
                    inspection.id
                  ] ?? null
                }
              />
            ),
          )}
        </Box>
      ) : (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
            }}
          >
            No inspections found
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 1,
            }}
          >
            Run a new inspection or change
            the filter.
          </Typography>
        </Box>
      )}

      <Dialog
        open={isDialogOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsDialogOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Run New Vision Inspection
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2.5}
            sx={{
              mt: 1,
            }}
          >
            <Button
              component="label"
              variant="outlined"
              startIcon={
                <UploadFileRoundedIcon />
              }
              disabled={isSubmitting}
            >
              {selectedFile
                ? "Change inspection image"
                : "Select inspection image"}

              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file =
                    event.target
                      .files?.[0] ??
                    null;

                  setSelectedFile(file);
                }}
              />
            </Button>

            {selectedFile && (
              <Alert severity="info">
                Selected:{" "}
                {selectedFile.name} ?{" "}
                {(
                  selectedFile.size /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB
              </Alert>
            )}

            <TextField
              label="Product or asset name"
              value={productName}
              onChange={(event) =>
                setProductName(
                  event.target.value,
                )
              }
              required
              fullWidth
              slotProps={{
                htmlInput: {
                  maxLength: 150,
                },
              }}
            />

            <TextField
              select
              label="Related machine"
              value={machineId}
              onChange={(event) =>
                setMachineId(
                  event.target.value,
                )
              }
              fullWidth
            >
              <MenuItem value="">
                No machine selected
              </MenuItem>

              {machines.map((machine) => (
                <MenuItem
                  key={machine.id}
                  value={machine.id}
                >
                  {machine.name} ?{" "}
                  {machine.asset_code}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Camera"
              value={camera}
              onChange={(event) =>
                setCamera(
                  event.target.value,
                )
              }
              fullWidth
              slotProps={{
                htmlInput: {
                  maxLength: 100,
                },
              }}
              placeholder="CAM-QA-01"
            />

            <TextField
              label="Zone"
              value={zone}
              onChange={(event) =>
                setZone(
                  event.target.value,
                )
              }
              fullWidth
              slotProps={{
                htmlInput: {
                  maxLength: 150,
                },
              }}
              placeholder="Quality Line A"
            />

            <TextField
              label="Inspection instructions"
              value={inspectionContext}
              onChange={(event) =>
                setInspectionContext(
                  event.target.value,
                )
              }
              fullWidth
              multiline
              minRows={4}
              slotProps={{
                htmlInput: {
                  maxLength: 2000,
                },
              }}
              placeholder={
                "Describe the visible defect, safety risk, or quality condition the model should inspect."
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            onClick={() => {
              setIsDialogOpen(false);
              resetForm();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              void handleSubmitInspection();
            }}
            disabled={
              isSubmitting ||
              !selectedFile ||
              !productName.trim()
            }
            startIcon={
              isSubmitting ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <CameraAltRoundedIcon />
              )
            }
          >
            {isSubmitting
              ? "Analyzing image..."
              : "Run inspection"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
