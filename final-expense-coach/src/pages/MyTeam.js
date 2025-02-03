import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

function MyTeam() {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamData, setTeamData] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const db = getFirestore();
        let teamQuery;

        if (userRole === "sales_manager") {
          // Sales managers see all their assigned agents
          teamQuery = query(
            collection(db, "users"),
            where("managerId", "==", currentUser.uid),
            where("role", "==", "agent")
          );
        } else if (userRole === "agent") {
          // Agents only see their own team members (same manager)
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const managerId = userDoc.data()?.managerId;

          if (managerId) {
            teamQuery = query(
              collection(db, "users"),
              where("managerId", "==", managerId),
              where("role", "==", "agent")
            );
          }
        }

        if (teamQuery) {
          const querySnapshot = await getDocs(teamQuery);
          const teamMembers = [];

          for (const docRef of querySnapshot.docs) {
            const userData = docRef.data();

            // Get performance data
            const performanceDoc = await getDoc(
              doc(db, "performance", docRef.id)
            );
            const performanceData = performanceDoc.data() || {};

            // Get call grades
            const callGradesQuery = query(
              collection(db, "callGrades"),
              where("agentId", "==", docRef.id),
              where(
                "date",
                ">=",
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ) // Last 30 days
            );
            const callGradesSnapshot = await getDocs(callGradesQuery);
            const callGrades = [];
            callGradesSnapshot.forEach((grade) =>
              callGrades.push(grade.data())
            );

            teamMembers.push({
              id: docRef.id,
              name: `${userData.firstName} ${userData.lastName}`,
              email: userData.email,
              rank: performanceData.rank || "N/A",
              callScore: performanceData.callScore || 0,
              monthlyApps: performanceData.monthlyApps || 0,
              recentGrades: callGrades,
            });
          }

          // Sort by performance metrics
          teamMembers.sort((a, b) => b.monthlyApps - a.monthlyApps);
          setTeamData(teamMembers);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching team data:", error);
        setError("Failed to fetch team data");
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [currentUser, userRole]);

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

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {userRole === "sales_manager" ? "My Agents" : "My Team"}
      </Typography>

      <Tabs
        value={selectedTab}
        onChange={(e, newValue) => setSelectedTab(newValue)}
      >
        <Tab label="Performance Rankings" />
        <Tab label="Call Grades" />
        {userRole === "sales_manager" && <Tab label="Team Metrics" />}
      </Tabs>

      <Box mt={3}>
        {selectedTab === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Call Score</TableCell>
                  <TableCell align="right">Monthly Apps</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamData.map((teammate, index) => (
                  <TableRow
                    key={teammate.id}
                    sx={{
                      backgroundColor:
                        teammate.id === currentUser.uid
                          ? "action.selected"
                          : "inherit",
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{teammate.name}</TableCell>
                    <TableCell align="right">{teammate.callScore}%</TableCell>
                    <TableCell align="right">{teammate.monthlyApps}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selectedTab === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell>Recent Grades</TableCell>
                  <TableCell>Average Score</TableCell>
                  <TableCell>Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamData.map((teammate) => (
                  <TableRow key={teammate.id}>
                    <TableCell>{teammate.name}</TableCell>
                    <TableCell>
                      {teammate.recentGrades.length} grades in last 30 days
                    </TableCell>
                    <TableCell>
                      {(
                        teammate.recentGrades.reduce(
                          (acc, grade) => acc + grade.score,
                          0
                        ) / teammate.recentGrades.length || 0
                      ).toFixed(1)}
                      %
                    </TableCell>
                    <TableCell>{/* Add trend visualization here */}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {selectedTab === 2 && userRole === "sales_manager" && (
          <Box>
            {/* Add team metrics dashboard here */}
            <Typography variant="h6" gutterBottom>
              Team Performance Metrics
            </Typography>
            {/* Add charts and metrics */}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default MyTeam;
