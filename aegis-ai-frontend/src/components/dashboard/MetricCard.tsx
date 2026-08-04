import type { ReactNode } from "react";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  iconBackground: string;
  iconColor: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  iconBackground,
  iconColor,
}: MetricCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        backgroundImage: "none",
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.2s ease, border-color 0.2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "primary.main",
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between"
            }}>
            <Typography
              sx={{
                color: "text.secondary",
                fontWeight: 600
              }}>
              {title}
            </Typography>

            <Box
              sx={{
                width: 46,
                height: 46,
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                backgroundColor: iconBackground,
                color: iconColor,
              }}
            >
              {icon}
            </Box>
          </Stack>

          <Typography variant="h4" sx={{
            fontWeight: 800
          }}>
            {value}
          </Typography>

          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {description}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
