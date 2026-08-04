import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import type {
  VisionInspectionResult,
  VisionInspectionSeverity,
  VisionInspectionStatus,
} from "../../services/visionInspectionService";


interface VisionInspectionCardProps {
  inspectionId: string;
  productName: string;
  camera: string | null;
  zone: string | null;
  detectedAt: string;
  finding: string | null;
  confidence: number | null;
  result: VisionInspectionResult | null;
  severity: VisionInspectionSeverity | null;
  status: VisionInspectionStatus;
  defectType: string | null;
  recommendedAction: string | null;
  analysisDurationMs: number | null;
  imageUrl: string | null;
}


const resultColorMap: Record<
  VisionInspectionResult,
  "success" | "error" | "warning"
> = {
  Pass: "success",
  Defect: "error",
  Review: "warning",
};


const severityColorMap: Record<
  VisionInspectionSeverity,
  "success" | "warning" | "error"
> = {
  Low: "success",
  Medium: "warning",
  High: "error",
  Critical: "error",
};


function getResultIcon(
  result: VisionInspectionResult | null,
  status: VisionInspectionStatus,
) {
  if (status === "Failed") {
    return <ErrorRoundedIcon />;
  }

  if (result === "Pass") {
    return <CheckCircleRoundedIcon />;
  }

  if (result === "Defect") {
    return <ErrorRoundedIcon />;
  }

  return <VisibilityRoundedIcon />;
}


function getStatusColor(
  result: VisionInspectionResult | null,
  status: VisionInspectionStatus,
): "success" | "error" | "warning" | "info" | "default" {
  if (status === "Failed") {
    return "error";
  }

  if (status === "Processing") {
    return "info";
  }

  if (status === "Pending") {
    return "warning";
  }

  if (result) {
    return resultColorMap[result];
  }

  return "default";
}


export function VisionInspectionCard({
  inspectionId,
  productName,
  camera,
  zone,
  detectedAt,
  finding,
  confidence,
  result,
  severity,
  status,
  defectType,
  recommendedAction,
  analysisDurationMs,
  imageUrl,
}: VisionInspectionCardProps) {
  const displayLabel =
    status === "Completed"
      ? result ?? "Review"
      : status;

  return (
    <Card
      sx={{
        height: "100%",
        backgroundImage: "none",
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        transition:
          "transform 0.2s ease, border-color 0.2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
          borderColor:
            result === "Defect"
              ? "error.main"
              : "primary.main",
        },
      }}
    >
      <Box
        sx={{
          height: 220,
          position: "relative",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg, rgba(47,128,237,0.2), rgba(0,194,168,0.08))",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={`Inspection image for ${productName}`}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <CameraAltRoundedIcon
            sx={{
              fontSize: 72,
              color: "rgba(255,255,255,0.22)",
            }}
          />
        )}

        <Chip
          label={displayLabel}
          color={getStatusColor(result, status)}
          icon={getResultIcon(result, status)}
          size="small"
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
          }}
        />

        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            bottom: 12,
            left: 14,
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: "rgba(7,17,31,0.82)",
          }}
        >
          {inspectionId}
        </Typography>
      </Box>

      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                {productName}
              </Typography>

              {severity && (
                <Chip
                  label={`${severity} severity`}
                  size="small"
                  color={severityColorMap[severity]}
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Camera
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                {camera ?? "Not specified"}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Zone
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                {zone ?? "Not specified"}
              </Typography>
            </Box>
          </Box>

          {defectType && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Defect type
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  mt: 0.5,
                }}
              >
                {defectType}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
              }}
            >
              AI finding
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                lineHeight: 1.6,
              }}
            >
              {finding ??
                "The inspection is waiting for an AI result."}
            </Typography>
          </Box>

          {recommendedAction && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Recommended action
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  lineHeight: 1.6,
                }}
              >
                {recommendedAction}
              </Typography>
            </Box>
          )}

          <Box>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                }}
              >
                Model confidence
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                }}
              >
                {confidence !== null
                  ? `${Math.round(confidence)}%`
                  : "Pending"}
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={confidence ?? 0}
              color={
                result
                  ? resultColorMap[result]
                  : "primary"
              }
              sx={{
                height: 8,
                borderRadius: 10,
                backgroundColor:
                  "rgba(255,255,255,0.06)",
              }}
            />
          </Box>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
            sx={{
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
              }}
            >
              Created: {detectedAt}
            </Typography>

            {analysisDurationMs !== null && (
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Analysis:{" "}
                {(analysisDurationMs / 1000).toFixed(1)}s
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
