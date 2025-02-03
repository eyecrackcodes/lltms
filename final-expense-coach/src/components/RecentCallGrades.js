import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

function RecentCallGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const db = getFirestore();
        const gradesQuery = query(
          collection(db, "callGrades"),
          where("agentId", "==", currentUser.uid),
          orderBy("date", "desc"),
          limit(5)
        );

        console.log("Fetching grades for agent:", currentUser.uid);

        const snapshot = await getDocs(gradesQuery);
        const gradesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (
            data &&
            data.totalScore !== undefined &&
            data.date &&
            data.sections
          ) {
            gradesData.push({
              id: doc.id,
              score: data.totalScore,
              date: data.date,
              graderName: data.graderName || "Unknown Grader",
              sections: data.sections || {},
            });
          }
        });

        console.log("Fetched grades data:", gradesData);
        setGrades(gradesData);
        setLoading(false);
      } catch (error) {
        console.error("Error details:", error);
        setError("Failed to load recent grades");
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchGrades();
    }
  }, [currentUser]);

  const renderSectionScores = (sections) => {
    if (!sections) return null;

    return Object.entries(sections)
      .filter(([_, section]) => section && section.completed)
      .map(([name, section]) => (
        <Typography key={name} component="span" variant="body2">
          {name.charAt(0).toUpperCase() + name.slice(1)}:{" "}
          {section.score ? section.score.toFixed(0) : "0"}%{" "}
        </Typography>
      ));
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (grades.length === 0) return <Typography>No grades available</Typography>;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          My Recent Call Grades
        </Typography>
        <List>
          {grades.map((grade, index) => (
            <React.Fragment key={grade.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      Score:{" "}
                      {typeof grade.score === "number"
                        ? grade.score.toFixed(0)
                        : "0"}
                      %
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        Date: {new Date(grade.date).toLocaleDateString()}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Graded by: {grade.graderName || "Unknown Grader"}
                      </Typography>
                      <br />
                      {renderSectionScores(grade.sections)}
                    </>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default RecentCallGrades;
