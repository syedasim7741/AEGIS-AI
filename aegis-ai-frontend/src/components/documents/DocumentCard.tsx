import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import type { RAGDocumentStatus } from "../../services/ragDocumentService";


interface DocumentCardProps {
  title: string;
  category?: string;
  status?: RAGDocumentStatus;
  details: string;
  uploadedAt: string;
  selected: boolean;
  onSelect: () => void;
}


function getStatusColor(
  status: RAGDocumentStatus,
): "default" | "warning" | "info" | "success" | "error" {
  switch (status) {
    case "Pending":
      return "warning";

    case "Processing":
      return "info";

    case "Ready":
      return "success";

    case "Failed":
      return "error";

    default:
      return "default";
  }
}


export function DocumentCard({
  title,
  category,
  status,
  details,
  uploadedAt,
  selected,
  onSelect,
}: DocumentCardProps) {
  return (
    <Card
      sx={{
        backgroundImage: "none",
        backgroundColor: selected
          ? "rgba(47, 128, 237, 0.12)"
          : "background.paper",
        border: "1px solid",
        borderColor: selected
          ? "primary.main"
          : "divider",
        transition:
          "transform 0.2s ease, border-color 0.2s ease",

        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "primary.main",
        },
      }}
    >
      <CardActionArea onClick={onSelect}>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 2,
                    color: "primary.light",
                    backgroundColor:
                      "rgba(47, 128, 237, 0.14)",
                  }}
                >
                  <DescriptionRoundedIcon />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    {details}
                  </Typography>
                </Box>
              </Stack>

              {selected && (
                <CheckCircleRoundedIcon
                  color="primary"
                  fontSize="small"
                />
              )}
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {status ? (
                <Chip
                  label={status}
                  size="small"
                  variant="outlined"
                  color={getStatusColor(status)}
                  icon={
                    status === "Processing" ? (
                      <CircularProgress
                        size={14}
                        color="inherit"
                      />
                    ) : undefined
                  }
                />
              ) : (
                <Chip
                  label={category ?? "Document"}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                {uploadedAt}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
