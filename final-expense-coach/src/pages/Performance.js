import React from "react";
import { Box, Container } from "@mui/material";
import PerformanceReport from "../components/PerformanceReport";
import { useAuth } from "../contexts/AuthContext";

function Performance() {
  const { currentUser } = useAuth();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ 
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <PerformanceReport />
      </Box>
    </Container>
  );
}

export default React.memo(Performance);
