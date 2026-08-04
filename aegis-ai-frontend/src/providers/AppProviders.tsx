import type { PropsWithChildren } from "react";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ReduxProvider } from "react-redux";
import { BrowserRouter } from "react-router";

import { queryClient } from "../app/queryClient";
import { store } from "../store/store";
import { appTheme } from "../theme/theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />

          <BrowserRouter>{children}</BrowserRouter>

          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
