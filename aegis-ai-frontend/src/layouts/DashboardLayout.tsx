import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { httpClient } from "../api/httpClient";

import { routeAccess } from "../constants/accessControl";

import { useAppDispatch, useAppSelector } from "../store/hooks";

import { logout, type UserRole } from "../store/slices/authSlice";

const drawerWidth = 260;

interface NavigationItem {
  label: string;
  pageTitle: string;
  path: string;
  icon: ReactNode;
  allowedRoles: readonly UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    pageTitle: "Operations Overview",
    path: "/dashboard",
    icon: <DashboardRoundedIcon />,
    allowedRoles: routeAccess.dashboard,
  },
  {
    label: "Analytics",
    pageTitle: "Industrial Analytics",
    path: "/analytics",
    icon: <AnalyticsRoundedIcon />,
    allowedRoles: routeAccess.analytics,
  },
  {
    label: "Robot Monitoring",
    pageTitle: "Robot Monitoring",
    path: "/robots",
    icon: <PrecisionManufacturingRoundedIcon />,
    allowedRoles: routeAccess.robots,
  },
  {
    label: "Worker Safety",
    pageTitle: "Worker Safety",
    path: "/safety",
    icon: <HealthAndSafetyRoundedIcon />,
    allowedRoles: routeAccess.safety,
  },
  {
    label: "Vision Inspection",
    pageTitle: "Vision Inspection",
    path: "/vision",
    icon: <CameraAltRoundedIcon />,
    allowedRoles: routeAccess.vision,
  },
  {
    label: "Predictive Maintenance",
    pageTitle: "Predictive Maintenance",
    path: "/maintenance",
    icon: <BuildRoundedIcon />,
    allowedRoles: routeAccess.maintenance,
  },
  {
    label: "Workflow Automation",
    pageTitle: "Workflow Automation",
    path: "/workflows",
    icon: <BoltRoundedIcon />,
    allowedRoles: routeAccess.workflows,
  },
  {
    label: "Alerts",
    pageTitle: "Alerts & Notifications",
    path: "/alerts",
    icon: <NotificationsActiveRoundedIcon />,
    allowedRoles: routeAccess.alerts,
  },
  {
    label: "Document Assistant",
    pageTitle: "AI Document Assistant",
    path: "/documents",
    icon: <MenuBookRoundedIcon />,
    allowedRoles: routeAccess.documents,
  },
  {
    label: "AI Copilot",
    pageTitle: "AI Copilot",
    path: "/copilot",
    icon: <SmartToyRoundedIcon />,
    allowedRoles: routeAccess.copilot,
  },
  {
    label: "Administration",
    pageTitle: "User Administration",
    path: "/administration",
    icon: <AdminPanelSettingsRoundedIcon />,
    allowedRoles: routeAccess.administration,
  },
];

function createInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function DashboardLayout() {
  const dispatch = useAppDispatch();

  const location = useLocation();

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const [profileAnchorElement, setProfileAnchorElement] =
    useState<HTMLElement | null>(null);

  const user = useAppSelector((state) => state.auth.user);

  const unreadAlertCount = useAppSelector(
    (state) => state.alerts.alerts.filter((alert) => !alert.isRead).length,
  );

  const visibleNavigationItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return navigationItems.filter((item) =>
      item.allowedRoles.includes(user.role),
    );
  }, [user]);

  const currentNavigationItem = navigationItems.find(
    (item) => item.path === location.pathname,
  );

  const currentPageTitle =
    location.pathname === "/unauthorized"
      ? "Access Restricted"
      : location.pathname === "/profile"
        ? "My Profile"
        : (currentNavigationItem?.pageTitle ?? "AEGIS AI");

  const userName = user?.name ?? "AEGIS User";

  const userRole = user?.role ?? "Authorized User";

  const userDepartment = user?.department ?? "Industrial Operations";

  const userInitials = createInitials(userName);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  function openProfilePage() {
    setProfileAnchorElement(null);

    navigate("/profile");
  }

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setProfileAnchorElement(null);

    setIsSigningOut(true);

    try {
      await httpClient.post("/auth/logout");
    } catch (error: unknown) {
      console.error("Backend logout failed:", error);
    } finally {
      queryClient.clear();

      dispatch(logout());

      navigate("/login", {
        replace: true,
      });
    }
  }

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0b1626",
      }}
    >
      <Toolbar
        sx={{
          minHeight: 80,
          px: 3,
          flexShrink: 0,
        }}
      >
        <Stack>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "primary.main",
            }}
          >
            AEGIS AI
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
            }}
          >
            Industrial Intelligence
          </Typography>
        </Stack>
      </Toolbar>

      <Divider />

      <List
        sx={{
          px: 1.5,
          py: 2,
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        {visibleNavigationItems.map((item) => {
          const isSelected = location.pathname === item.path;

          const isAlertsItem = item.path === "/alerts";

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={isSelected}
              sx={{
                mb: 0.75,
                minHeight: 48,
                borderRadius: 2,
                color: "text.secondary",

                "&:hover": {
                  color: "text.primary",

                  backgroundColor: "rgba(255,255,255,0.05)",
                },

                "&.Mui-selected": {
                  color: "primary.light",

                  backgroundColor: "rgba(47,128,237,0.14)",
                },

                "&.Mui-selected:hover": {
                  backgroundColor: "rgba(47,128,237,0.2)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 42,
                  color: "inherit",
                }}
              >
                {isAlertsItem ? (
                  <Badge
                    badgeContent={unreadAlertCount}
                    color="error"
                    max={99}
                    invisible={unreadAlertCount === 0}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: 600,
                      fontSize: 14,
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box
        sx={{
          p: 2,
          flexShrink: 0,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              backgroundColor: "primary.main",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {userInitials}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 700,
              }}
            >
              {userName}
            </Typography>

            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "text.secondary",

                display: "block",
              }}
            >
              {userRole}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: {
            xs: "100%",

            md: `calc(100% - ${drawerWidth}px)`,
          },

          ml: {
            xs: 0,
            md: `${drawerWidth}px`,
          },

          backgroundColor: "background.paper",

          borderBottom: "1px solid",

          borderColor: "divider",

          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label={"Open navigation menu"}
            onClick={() => setMobileDrawerOpen(true)}
            sx={{
              display: {
                xs: "inline-flex",
                md: "none",
              },

              mr: 1.5,
            }}
          >
            <MenuRoundedIcon />
          </IconButton>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,

                fontSize: {
                  xs: 16,
                  sm: 20,
                },
              }}
            >
              {currentPageTitle}
            </Typography>

            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "text.secondary",

                display: {
                  xs: "block",
                  sm: "none",
                },
              }}
            >
              AEGIS AI
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Stack
            direction="row"
            spacing={{
              xs: 0.5,
              sm: 1.5,
            }}
            sx={{
              alignItems: "center",
            }}
          >
            <Tooltip title={"Alerts and notifications"}>
              <IconButton
                color="inherit"
                aria-label={"View notifications"}
                onClick={() => navigate("/alerts")}
              >
                <Badge
                  badgeContent={unreadAlertCount}
                  color="error"
                  max={99}
                  invisible={unreadAlertCount === 0}
                >
                  <NotificationsRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Account menu">
              <IconButton
                aria-label={"Open account menu"}
                onClick={(event) =>
                  setProfileAnchorElement(event.currentTarget)
                }
                sx={{
                  p: 0,
                }}
              >
                <Avatar
                  sx={{
                    width: {
                      xs: 34,
                      sm: 38,
                    },

                    height: {
                      xs: 34,
                      sm: 38,
                    },

                    backgroundColor: "primary.main",

                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={profileAnchorElement}
        open={Boolean(profileAnchorElement)}
        onClose={() => setProfileAnchorElement(null)}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 270,
              mt: 1,
              backgroundImage: "none",
            },
          },
        }}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <AccountCircleRoundedIcon />
          </ListItemIcon>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 700,
              }}
            >
              {userName}
            </Typography>

            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "text.secondary",

                display: "block",
              }}
            >
              {user?.email}
            </Typography>

            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "primary.main",

                display: "block",
              }}
            >
              {userDepartment}
            </Typography>

            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "secondary.main",

                display: "block",
              }}
            >
              {userRole}
            </Typography>
          </Box>
        </MenuItem>

        <Divider />

        <MenuItem onClick={openProfilePage}>
          <ListItemIcon>
            <ManageAccountsRoundedIcon fontSize="small" />
          </ListItemIcon>
          My Profile
        </MenuItem>

        <MenuItem
          disabled={isSigningOut}
          onClick={() => {
            void handleLogout();
          }}
        >
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>

          {isSigningOut ? "Signing out..." : "Sign out"}
        </MenuItem>
      </Menu>

      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          "& .MuiDrawer-paper": {
            width: drawerWidth,

            boxSizing: "border-box",

            borderRight: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: {
            xs: "none",
            md: "block",
          },

          width: drawerWidth,

          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,

            boxSizing: "border-box",

            borderRight: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,

          width: {
            xs: "100%",

            md: `calc(100% - ${drawerWidth}px)`,
          },

          minWidth: 0,

          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },

          py: {
            xs: 2,
            md: 4,
          },
        }}
      >
        <Toolbar />

        <Outlet />
      </Box>
    </Box>
  );
}
