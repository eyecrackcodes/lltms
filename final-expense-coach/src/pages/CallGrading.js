import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Alert,
  Stack,
  Tooltip,
  InputAdornment,
  TableSortLabel,
  CircularProgress,
  Rating,
  Divider,
  Card,
  CardContent,
  FormGroup,
  FormLabel,
  Container,
  Avatar,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import {
  addCallGrade,
  verifyCallGrade,
  getCallGrades,
  deleteCallGrade,
} from "../firebase/firebaseUtils";
import { useCallGrading } from "../contexts/CallGradingContext";
import { getAuth } from "firebase/auth";
import { getCurrentUserData } from "../firebase/firebaseUtils";
import { getAgents } from "../firebase/firebaseUtils";
import { isSuperAdmin } from "../firebase/firebaseUtils";
import { useAuth } from "../contexts/AuthContext";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  orderBy,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import SaveIcon from "@mui/icons-material/Save";

const sections = [
  {
    title: "Intake (10%)",
    items: [
      { name: "Name/Contact Details (0-2 points)", id: "name_contact", max: 2 },
      { name: "Home Address (0-2 points)", id: "home_address", max: 2 },
      { name: "Email for Recap (0-2 points)", id: "email", max: 2 },
      { name: "NPN/Read About Company (0-2 points)", id: "npn", max: 2 },
      { name: "Picture/Text Contact (0-2 points)", id: "picture", max: 2 },
    ],
  },
  {
    title: "Eligibility (10%)",
    items: [
      { name: "First Few Minutes Qualify (0-3 points)", id: "qualify", max: 3 },
      {
        name: "Birth Date/Checking/Savings/Direct Express (0-4 points)",
        id: "payment",
        max: 4,
      },
      {
        name: "Recent Death/Replaced/Add On (0-3 points)",
        id: "reason",
        max: 3,
      },
    ],
  },
  {
    title: "Understanding the Situation (10%)",
    items: [
      {
        name: "Coverage Now/Held/Back/Applied (0-4 points)",
        id: "coverage_status",
        max: 4,
      },
      { name: "Primary Beneficiary (0-3 points)", id: "beneficiary", max: 3 },
      {
        name: "Coverage Level/Funeral vs Legacy (0-3 points)",
        id: "coverage_type",
        max: 3,
      },
    ],
  },
  {
    title: "Credibility (10%)",
    items: [
      {
        name: "Austin TX & Charlotte NC/5-Star Google (0-4 points)",
        id: "location_rating",
        max: 4,
      },
      { name: "A+ BBB Rating (0-3 points)", id: "bbb", max: 3 },
      {
        name: "Government Lookup/NPN Verify (0-3 points)",
        id: "verification",
        max: 3,
      },
    ],
  },
  {
    title: "Luminary Life Index (10%)",
    items: [
      {
        name: "Build Custom Plan/Better Pricing (0-4 points)",
        id: "custom_plan",
        max: 4,
      },
      {
        name: "No Medical Exam/3-5 Min Application (0-3 points)",
        id: "no_exam",
        max: 3,
      },
      {
        name: "Age/Gender/Tobacco/Health History (0-3 points)",
        id: "factors",
        max: 3,
      },
    ],
  },
  {
    title: "Underwriting (10%)",
    items: [
      {
        name: "Tobacco/Height/Weight (0-5 points)",
        id: "health_metrics",
        max: 5,
      },
      { name: "19 Questions (0-5 points)", id: "questions", max: 5 },
    ],
  },
  {
    title: "Education (10%)",
    items: [
      {
        name: "Term/Permanent/10-20/20s,30s,40s/Over 50 (0-4 points)",
        id: "plan_types",
        max: 4,
      },
      {
        name: "Payments Locked/Benefits Locked/Never Expire (0-3 points)",
        id: "features",
        max: 3,
      },
      { name: "Absolutely Fits Budget (0-3 points)", id: "budget_fit", max: 3 },
    ],
  },
  {
    title: "Recap (10%)",
    items: [
      {
        name: "Full Understanding of Situation (0-4 points)",
        id: "understanding",
        max: 4,
      },
      {
        name: "Address/Birth Date/Coverage/Beneficiary (0-3 points)",
        id: "verify_details",
        max: 3,
      },
      {
        name: "Guarantee Trust Life Recommendation (0-3 points)",
        id: "recommendation",
        max: 3,
      },
    ],
  },
  {
    title: "Presentation (10%)",
    items: [
      {
        name: "Different Coverage Levels (0-4 points)",
        id: "coverage_levels",
        max: 4,
      },
      {
        name: "Option 1/Option 2/Option 3 (0-3 points)",
        id: "options",
        max: 3,
      },
      {
        name: "Comfortable Budget Fit (0-3 points)",
        id: "budget_comfort",
        max: 3,
      },
    ],
  },
  {
    title: "The Close (10%)",
    items: [
      {
        name: "Coverage Option Most Comfortable (0-5 points)",
        id: "comfort_level",
        max: 5,
      },
      {
        name: "Application/Payment/Review (0-5 points)",
        id: "final_steps",
        max: 5,
      },
    ],
  },
];

// Fix the initialSections structure to match the sections array
const initialSections = sections.reduce((acc, section) => {
  acc[section.title.toLowerCase().split(' ')[0]] = {
    includeInGrading: false,
    criteria: section.items.reduce((items, item) => {
      items[item.id] = {
        score: 0,
        max: item.max,
        checked: false
      };
      return items;
    }, {})
  };
  return acc;
}, {});

function CallGrading() {
  const { currentUser, userRole } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState("");
  const [agents, setAgents] = useState([]);
  const [gradeData, setGradeData] = useState(initialSections);
  const [error, setError] = useState("");
  const [gradeHistory, setGradeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageScores, setAverageScores] = useState({
    intake: 0,
    eligibility: 0,
    situation: 0,
    credibility: 0,
    luminaryIndex: 0,
    underwriting: 0,
    education: 0,
    recap: 0,
    presentation: 0,
    closing: 0,
    total: 0,
  });

  // Initialize active sections state with all sections as false
  const [activeSections, setActiveSections] = useState({
    intake: false,
    eligibility: false,
    situation: false,
    credibility: false,
    luminaryIndex: false,
    underwriting: false,
    education: false,
    recap: false,
    presentation: false,
    closing: false,
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!currentUser) return;

      try {
        console.log("Fetching data for user:", currentUser.email);
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();

        if (!mounted) return;

        const role = userData?.role;
        console.log("User role:", role);

        // For admin/manager, fetch agents
        if (
          role === "admin" ||
          role === "sales_manager" ||
          isSuperAdmin(currentUser.email)
        ) {
          console.log("Fetching agents for admin/manager");

          // Query for agents
          const agentsRef = collection(db, "users");
          const agentsQuery = query(agentsRef, where("role", "==", "agent"));
          const snapshot = await getDocs(agentsQuery);

          console.log("Found agents:", snapshot.docs.length);

          const agentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: `${doc.data().firstName || ""} ${
              doc.data().lastName || ""
            }`.trim(),
            email: doc.data().email,
          }));

          console.log("Processed agents data:", agentsData);
          setAgents(agentsData);
        }

        // For agents, fetch their grades
        if (role === "agent") {
          console.log("Fetching grades for agent");
          const gradesQuery = query(
            collection(db, "callGrades"),
            where("agentId", "==", currentUser.uid),
            orderBy("createdAt", "desc"),
            limit(10)
          );

          const gradesSnapshot = await getDocs(gradesQuery);
          const gradesData = gradesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().createdAt?.toDate() || new Date(),
          }));

          console.log("Found grades:", gradesData.length);
          setGradeHistory(gradesData);

          // Calculate averages safely
          if (gradesData.length > 0) {
            const newAverages = calculateAveragesFromGrades(gradesData);
            setAverageScores(newAverages);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (mounted) {
          setError("Failed to load data");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    const fetchAgentGrades = async () => {
      if (userRole !== "agent") return;

      console.log("Fetching grades for agent:", currentUser?.uid);
      try {
        const db = getFirestore();
        const gradesQuery = query(
          collection(db, "callGrades"),
          where("agentId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const querySnapshot = await getDocs(gradesQuery);
        console.log(
          "Raw grades from Firestore:",
          querySnapshot.docs.map((doc) => doc.data())
        );

        const grades = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt?.toDate() || new Date(),
        }));

        console.log("Processed grades:", grades);
        setGradeHistory(grades);
        setLoading(false);
      } catch (error) {
        console.error("Grade fetch error:", error);
        setError("Failed to load grades");
        setLoading(false);
      }
    };

    fetchAgentGrades();
  }, [currentUser?.uid, userRole]);

  // Update handleSectionToggle
  const handleSectionToggle = (sectionName) => (event) => {
    setGradeData((prevData) => ({
      ...prevData,
      [sectionName]: {
        ...prevData[sectionName],
        includeInGrading: event.target.checked,
      }
    }));
  };

  // Update handleCheckboxChange
  const handleCheckboxChange = (sectionName, itemId) => (event) => {
    setGradeData((prevData) => ({
      ...prevData,
      [sectionName]: {
        ...prevData[sectionName],
        criteria: {
          ...prevData[sectionName].criteria,
          [itemId]: {
            ...prevData[sectionName].criteria[itemId],
            checked: event.target.checked
          }
        }
      }
    }));
  };

  // Reset form when agent changes
  const handleAgentSelect = (event) => {
    setSelectedAgent(event.target.value);
    setGradeData(initialSections);
    setActiveSections({
      intake: false,
      eligibility: false,
      situation: false,
      credibility: false,
      luminaryIndex: false,
      underwriting: false,
      education: false,
      recap: false,
      presentation: false,
      closing: false,
    });
  };

  const handleNotesChange = (event) => {
    setGradeData((prev) => ({
      ...prev,
      notes: event.target.value,
    }));
  };

  // Update the calculateSectionScore function
  const calculateSectionScore = (sectionName) => {
    const sectionState = gradeData[sectionName];
    if (!sectionState || !sectionState.includeInGrading) return 0;

    const sectionData = sections.find(s => 
      s.title.toLowerCase().startsWith(sectionName.toLowerCase())
    );
    if (!sectionData) return 0;

    const totalPoints = sectionData.items.reduce((sum, item) => sum + item.max, 0);
    const earnedPoints = sectionData.items.reduce((sum, item) => {
      const criteria = sectionState.criteria[item.id];
      return sum + (criteria?.checked ? item.max : 0);
    }, 0);

    return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  };

  // Update the calculateTotalScore function
  const calculateTotalScore = () => {
    const activeSections = Object.keys(sections).filter(
      (section) => sections[section]?.includeInGrading
    );

    if (activeSections.length === 0) return 0;

    const totalScore = activeSections.reduce((sum, section) => {
      return sum + calculateSectionScore(section);
    }, 0);

    return totalScore / activeSections.length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!selectedAgent) {
        setError("Please select an agent");
        return;
      }

      console.log("Starting grade submission...");
      console.log("Selected Agent:", selectedAgent);
      console.log("Raw Grade Data:", gradeData);

      // Calculate scores first
      const sectionScores = {};
      Object.keys(gradeData)
        .filter((key) => key !== "notes")
        .forEach((section) => {
          sectionScores[section] = calculateSectionScore(section);
        });

      const totalScore = calculateTotalScore();

      const submissionData = {
        agentId: selectedAgent,
        managerId: currentUser.uid,
        createdAt: serverTimestamp(),
        ...sectionScores,
        totalScore,
        notes: gradeData.notes || "",
        submittedBy: {
          uid: currentUser.uid,
          email: currentUser.email,
          role: userRole,
        },
      };

      console.log("Final submission data:", submissionData);

      const db = getFirestore();
      const docRef = await addDoc(collection(db, "callGrades"), submissionData);
      console.log("Grade submitted successfully, doc ID:", docRef.id);

      // Show success message
      alert(
        `Grade submitted successfully!\nTotal Score: ${totalScore.toFixed(1)}%`
      );

      // Reset form
      setSelectedAgent("");
      setGradeData(initialSections);
    } catch (error) {
      console.error("Submission error:", error);
      setError(`Failed to submit grade: ${error.message}`);
    }
  };

  useEffect(() => {
    // Define all valid sections
    const sections = [
      "intake",
      "eligibility",
      "situation",
      "credibility",
      "luminaryIndex",
      "underwriting",
      "education",
      "recap",
      "presentation",
      "closing",
    ];

    // Check if any section is completed
    const hasCompletedSections = sections.some(
      (section) => gradeData[section]?.completed
    );

    if (hasCompletedSections) {
      const updates = sections.reduce((acc, section) => {
        acc[section] = {
          completed: gradeData[section]?.completed || false,
          score: gradeData[section] ? calculateSectionScore(section) : 0,
        };
        return acc;
      }, {});

      console.log("Real-time Score Updates:", {
        ...updates,
        totalScore: calculateTotalScore(),
      });
    }
  }, [gradeData]);

  const getScoreColor = (score) => {
    if (score >= 90) return "#4CAF50"; // Green
    if (score >= 80) return "#8BC34A"; // Light Green
    if (score >= 70) return "#FFC107"; // Amber
    if (score >= 60) return "#FF9800"; // Orange
    return "#F44336"; // Red
  };

  const getScoreEmoji = (score) => {
    if (score >= 90) return "🏆";
    if (score >= 80) return "🌟";
    if (score >= 70) return "👍";
    if (score >= 60) return "💪";
    return "🎯";
  };

  const calculateAchievements = (grades) => {
    return {
      perfectCalls: grades.filter((g) => g.totalScore >= 90).length,
      improvedCalls:
        grades.length > 1
          ? grades[0].totalScore > grades[1].totalScore
            ? 1
            : 0
          : 0,
      totalCalls: grades.length,
      bestScore: Math.max(...grades.map((g) => g.totalScore || 0)),
      averageScore: grades.length
        ? (
            grades.reduce((acc, g) => acc + (g.totalScore || 0), 0) /
            grades.length
          ).toFixed(0)
        : 0,
    };
  };

  const getAchievementBadges = (achievements) => {
    return [
      {
        name: "Perfect Caller",
        emoji: "🏆",
        earned: achievements.perfectCalls > 0,
        description: "Achieved 90% or higher on a call",
      },
      {
        name: "Rising Star",
        emoji: "⭐",
        earned: achievements.improvedCalls > 0,
        description: "Improved score from previous call",
      },
      {
        name: "Call Master",
        emoji: "👑",
        earned: achievements.totalCalls >= 5,
        description: "Completed 5 or more graded calls",
      },
      {
        name: "Consistency King",
        emoji: "🎯",
        earned: achievements.averageScore >= 75,
        description: "Maintained average score above 75%",
      },
    ];
  };

  const renderAchievementsSection = (grades) => {
    const achievements = calculateAchievements(grades);
    const badges = getAchievementBadges(achievements);

    return (
      <Card sx={{ mb: 3, p: 2, background: "#f8f9fa" }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🏅 Your Achievements
          </Typography>
          <Grid container spacing={2}>
            {badges.map((badge) => (
              <Grid item xs={6} sm={3} key={badge.name}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    opacity: badge.earned ? 1 : 0.5,
                    background: badge.earned ? "#fff" : "#f0f0f0",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: badge.earned ? "scale(1.05)" : "none",
                      boxShadow: badge.earned ? 3 : 0,
                    },
                  }}
                >
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    {badge.emoji}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {badge.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {badge.earned ? "Earned!" : "In Progress"}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {badge.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const calculateAveragesFromGrades = (grades) => {
    const sections = [
      "intake",
      "eligibility",
      "situation",
      "credibility",
      "luminaryIndex",
      "underwriting",
      "education",
      "recap",
      "presentation",
      "closing",
    ];

    const totals = grades.reduce((acc, grade) => {
      sections.forEach((section) => {
        acc[section] = (acc[section] || 0) + (grade[section]?.score || 0);
      });
      acc.total = (acc.total || 0) + (grade.totalScore || 0);
      return acc;
    }, {});

    const averages = sections.reduce((acc, section) => {
      acc[section] = grades.length ? totals[section] / grades.length : 0;
      return acc;
    }, {});

    averages.total = grades.length ? totals.total / grades.length : 0;

    return averages;
  };

  const renderAgentStats = () => (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{ mb: 3, color: "text.secondary", fontWeight: 500 }}
      >
        Performance Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: "linear-gradient(145deg, #2196f3 0%, #1976d2 100%)",
              color: "white",
              borderRadius: 2,
            }}
          >
            <Typography variant="overline" sx={{ opacity: 0.8 }}>
              Overall Score
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 600, my: 1 }}>
              {(averageScores.total || 0).toFixed(1)}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Average across all categories
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: "#f8f9fa",
              borderRadius: 2,
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Typography variant="overline" color="text.secondary">
                  Opening
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  {averageScores.opening.toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="overline" color="text.secondary">
                  Discovery
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  {averageScores.discovery.toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="overline" color="text.secondary">
                  Presentation
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  {averageScores.presentation.toFixed(1)}%
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="overline" color="text.secondary">
                  Closing
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  {averageScores.closing.toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAgentView = () => {
    if (loading) {
      return <CircularProgress />;
    }

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          My Call Grades
        </Typography>

        {gradeHistory.length === 0 ? (
          <Typography>No grades available yet.</Typography>
        ) : (
          <>
            {/* Latest Grade Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Latest Grade
              </Typography>
              <Typography variant="h3" color="primary">
                {gradeHistory[0].totalScore.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Graded on {gradeHistory[0].date.toLocaleDateString()}
              </Typography>
            </Paper>

            {/* Grade History */}
            <Typography variant="h6" gutterBottom>
              Grade History
            </Typography>
            {gradeHistory.map((grade) => (
              <Paper key={grade.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography>{grade.date.toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Score
                    </Typography>
                    <Typography>{grade.totalScore.toFixed(1)}%</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography>
                      {grade.notes || "No notes provided"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </>
        )}
      </Box>
    );
  };

  // Instead of mapping over sections directly, we'll define which sections to render
  const leftColumnSections = [
    { name: "intake", title: "Intake (10%)" },
    { name: "situation", title: "Understanding the Situation (10%)" },
    { name: "luminaryIndex", title: "Luminary Life Index (10%)" },
  ];

  const rightColumnSections = [
    { name: "eligibility", title: "Eligibility (10%)" },
    { name: "credibility", title: "Credibility (10%)" },
    { name: "underwriting", title: "Underwriting (10%)" },
  ];

  const renderManagerView = () => (
    <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Agent Selection Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2, // Reduced padding
          mb: 3,
          background: "#4285f4", // Matching blue from image
          color: "white",
          borderRadius: 2,
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={500} sx={{ mb: 1 }}>
              Call Grading
            </Typography>
            <FormControl
              fullWidth
              size="small"
              sx={{
                bgcolor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                },
                "& .MuiSelect-select": {
                  padding: "6px 12px", // Adjusted to match image
                  height: "20px", // Control height
                },
              }}
            >
              <InputLabel sx={{ ml: -0.5 }}>Select Agent</InputLabel>
              <Select
                value={selectedAgent}
                onChange={handleAgentSelect}
                label="Select Agent"
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ pl: 0.5 }} // Fine-tuned left padding
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.875rem",
                        }}
                      >
                        {agent.name?.charAt(0)}
                      </Avatar>
                      <Typography sx={{ ml: 1 }}>{agent.name}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedAgent && (
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "rgba(255,255,255,0.9)" }}
                >
                  Current Total Score
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: "white", fontWeight: 500 }}
                >
                  {calculateTotalScore().toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {leftColumnSections.map((section) =>
            renderSection(section.name, section.title)
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          {rightColumnSections.map((section) =>
            renderSection(section.name, section.title)
          )}
        </Grid>
      </Grid>
    </Box>
  );

  // Fix the renderSection function
  const renderSection = (sectionName, title) => {
    const sectionData = sections.find(s => 
      s.title.toLowerCase().startsWith(sectionName.toLowerCase())
    );
    
    if (!sectionData) return null;

    const sectionState = gradeData[sectionName] || initialSections[sectionName];
    const sectionScore = calculateSectionScore(sectionName);

    return (
      <Paper sx={{ p: 2, mb: 2 }} key={sectionName}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" color="primary">
            {sectionData.title}
          </Typography>
          <Typography
            sx={{
              bgcolor: sectionState.includeInGrading ? "primary.main" : "grey.400",
              color: "white",
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            {sectionScore.toFixed(1)}%
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={sectionState.includeInGrading}
              onChange={handleSectionToggle(sectionName)}
            />
          }
          label="Include in grading"
          sx={{ mb: 2 }}
        />

        {sectionData.items.map((item) => (
          <FormControlLabel
            key={`${sectionName}-${item.id}`}
            control={
              <Checkbox
                checked={sectionState.criteria[item.id]?.checked || false}
                onChange={handleCheckboxChange(sectionName, item.id)}
                disabled={!sectionState.includeInGrading}
              />
            }
            label={`${item.name} (${item.max} points)`}
            sx={{ display: "block", mb: 1 }}
          />
        ))}
      </Paper>
    );
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: { xs: 2, md: 4 },
        backgroundColor: "#f5f5f5", // Light grey background
        minHeight: "100vh",
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Call Grading
        </Typography>

        {userRole === "agent" && renderAgentView()}
        {(userRole === "sales_manager" || userRole === "admin") &&
          renderManagerView()}
      </Container>
    </Box>
  );
}

export default CallGrading;
