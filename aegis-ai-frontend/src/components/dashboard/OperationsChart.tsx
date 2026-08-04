import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const productionData = [
  {
    time: "08:00",
    output: 72,
    target: 80,
  },
  {
    time: "09:00",
    output: 78,
    target: 80,
  },
  {
    time: "10:00",
    output: 85,
    target: 82,
  },
  {
    time: "11:00",
    output: 88,
    target: 84,
  },
  {
    time: "12:00",
    output: 81,
    target: 84,
  },
  {
    time: "13:00",
    output: 90,
    target: 86,
  },
  {
    time: "14:00",
    output: 94,
    target: 88,
  },
  {
    time: "15:00",
    output: 91,
    target: 88,
  },
];

export function OperationsChart() {
  return (
    <Card
      sx={{
        height: "100%",
        backgroundImage: "none",
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{
              fontWeight: 700
            }}>
              Production Performance
            </Typography>

            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              Hourly production output compared with the operational target
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              height: 320,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={productionData}
                margin={{
                  top: 10,
                  right: 20,
                  left: -15,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="outputGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2f80ed" stopOpacity={0.45} />

                    <stop offset="95%" stopColor="#2f80ed" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="rgba(255, 255, 255, 0.08)"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  stroke="#a7b4c5"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                <YAxis
                  stroke="#a7b4c5"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  domain={[0, 100]}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#101d2e",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 10,
                  }}
                  labelStyle={{
                    color: "#f5f8fc",
                    fontWeight: 700,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#00c2a8"
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="6 5"
                />

                <Area
                  type="monotone"
                  dataKey="output"
                  name="Production Output"
                  stroke="#2f80ed"
                  strokeWidth={3}
                  fill="url(#outputGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
