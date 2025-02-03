import React from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  Stack,
  Link,
} from "@mui/material";
import {
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

function Performance() {
  const { currentUser } = useAuth();
  const isLuminaryUser = currentUser?.email?.endsWith("@luminarylife.com");
  const reportUrl =
    "https://lookerstudio.google.com/embed/reporting/cae920a3-5b27-4045-919f-f13f654d4fc6/page/p_sdxcac61od";

  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          height: "90vh", // Increased to match Schedule
          width: "100%",
          mt: 1,
          mb: 1,
        }}
      >
        <iframe
          src={reportUrl}
          style={{
            border: 0,
            width: "100%",
            height: "100%",
            borderRadius: "8px",
          }}
          frameBorder="0"
          scrolling="yes"
        ></iframe>
      </Box>
    </Container>
  );
}

export default Performance;
