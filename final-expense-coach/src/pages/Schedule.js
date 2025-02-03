import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Container,
} from "@mui/material";

function Schedule() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarLoaded, setCalendarLoaded] = useState(false);

  useEffect(() => {
    // Load the Google Calendar API
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load("client:auth2", initClient);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initClient = () => {
    window.gapi.client
      .init({
        apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
        scope: "https://www.googleapis.com/auth/calendar.events",
      })
      .then(() => {
        setCalendarLoaded(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error initializing Google Calendar:", error);
        setError("Failed to load calendar");
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          height: "90vh",
          width: "100%",
          mt: 1,
          mb: 1,
        }}
      >
        <iframe
          src={`https://calendar.google.com/calendar/embed?src=${currentUser.email}&ctz=local`}
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

export default Schedule;
