import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  writeBatch,
  increment,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";

// Add a simple cache at the top of the file
let agentsCache = {
  data: null,
  timestamp: null,
  params: null,
};

// Add this function to check authentication status
export const checkAuthStatus = () => {
  const auth = getAuth();
  console.log("Current user:", auth.currentUser);
  if (auth.currentUser) {
    console.log("User email:", auth.currentUser.email);
    console.log("User ID:", auth.currentUser.uid);
  } else {
    console.log("No user is signed in");
  }
};

// Agents Collection
export const addAgent = async (coachId, agentData) => {
  try {
    console.log("Adding agent with data:", { coachId, ...agentData }); // Debug log

    const agentRef = await addDoc(collection(db, "agents"), {
      ...agentData,
      coachId,
      createdAt: serverTimestamp(),
      status: agentData.status || "active",
      reporting: {
        ...agentData.reporting,
        directManagerId: coachId,
      },
      permissions: {
        canGradeOthers: ["director", "sales_manager", "team_lead"].includes(
          agentData.role
        ),
        canViewTeamMetrics: ["director", "sales_manager", "team_lead"].includes(
          agentData.role
        ),
        canEditTraining: ["director", "sales_manager"].includes(agentData.role),
      },
    });

    console.log("Agent added successfully with ID:", agentRef.id); // Debug log

    // Verify the data was written by immediately reading it back
    const newAgentSnap = await getDoc(agentRef);
    console.log("Verification - new agent data:", newAgentSnap.data()); // Debug log

    await createUserWithRole({
      ...agentData,
      agentId: agentRef.id,
    });

    // Clear the cache after adding a new agent
    clearAgentsCache();

    return agentRef.id;
  } catch (error) {
    console.error("Error adding agent:", error);
    throw error;
  }
};

// Modify getAgents to include auth checking
export const getAgents = async () => {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    const agents = [];

    usersSnapshot.forEach((doc) => {
      const userData = {
        id: doc.id,
        ...doc.data(),
        // Create a display name from firstName and lastName
        displayName: `${doc.data().firstName || ""} ${
          doc.data().lastName || ""
        }`.trim(),
      };
      agents.push(userData);
    });

    console.log("Fetched agents:", agents);
    return agents;
  } catch (error) {
    console.error("Error getting agents:", error);
    throw error;
  }
};

// Add this helper function to get current user data
export const getCurrentUserData = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return null;
    }

    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      return {
        id: currentUser.uid,
        email: currentUser.email,
        ...userDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting current user data:", error);
    return null;
  }
};

// Add a function to clear the cache when needed
export const clearAgentsCache = () => {
  agentsCache = {
    data: null,
    timestamp: null,
    params: null,
  };
};

// Add these collection references
const gradesCollection = collection(db, "callGrades");
const usersCollection = collection(db, "users");
const metricsCollection = collection(db, "metrics");

// Training Module Collection References
const trainingModulesCollection = collection(db, "trainingModules");
const assignmentsCollection = collection(db, "trainingAssignments");

// Training Module Types
export const MODULE_TYPES = {
  COURSE: "course",
  LESSON: "lesson",
  QUIZ: "quiz",
  VIDEO: "video",
  SLIDES: "slides",
  PRACTICE: "practice",
  ASSESSMENT: "assessment",
  DOCUMENT: "document",
};

// Training Module Structure
export const addTrainingModule = async (moduleData) => {
  try {
    const userRole = await getUserRole(auth.currentUser.uid);
    if (!["admin", "director", "manager"].includes(userRole)) {
      throw new Error("Insufficient permissions to create training modules");
    }

    const moduleRef = await addDoc(collection(db, "trainingModules"), {
      ...moduleData,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });
    return moduleRef.id;
  } catch (error) {
    console.error("Error adding training module:", error);
    throw error;
  }
};

// Update the addCallGrade function for better structure
export const addCallGrade = async (gradeData) => {
  try {
    const batch = writeBatch(db);
    const { currentUser } = getAuth();

    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    const userData = await getCurrentUserData();

    // Check if user is super admin
    const isAdmin = isSuperAdmin(currentUser.email);

    if (!userData && !isAdmin) {
      throw new Error("User data not found and not a super admin");
    }

    // Add the grade
    const gradeRef = doc(gradesCollection);
    const gradeDoc = {
      ...gradeData,
      graderId: currentUser.uid,
      graderName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
      metadata: {
        location: isAdmin
          ? gradeData.metadata?.location || "All"
          : userData?.location || "Unknown",
        managerId: isAdmin
          ? currentUser.uid
          : userData?.reportsTo || currentUser.uid,
        month: new Date(gradeData.callDate).getMonth(),
        year: new Date(gradeData.callDate).getFullYear(),
        weekNumber: getWeekNumber(new Date(gradeData.callDate)),
        gradedByAdmin: isAdmin,
      },
    };
    batch.set(gradeRef, gradeDoc);

    // Update agent's metrics
    const agentMetricsRef = doc(metricsCollection, gradeData.agentId);
    batch.set(
      agentMetricsRef,
      {
        lastGradeId: gradeRef.id,
        lastGradeDate: gradeData.callDate,
        totalGrades: increment(1),
        averageScore: calculateNewAverage(gradeData.totalScore),
        updatedAt: serverTimestamp(),
        lastGradedBy: currentUser.email,
        lastGradedByAdmin: isAdmin,
      },
      { merge: true }
    );

    await batch.commit();
    return gradeRef.id;
  } catch (error) {
    console.error("Error adding call grade:", error);
    throw error;
  }
};

// Add real-time listeners for better performance
export const subscribeToCallGrades = (filters, callback) => {
  const constraints = buildQueryConstraints(filters);
  const q = query(gradesCollection, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const grades = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(grades);
  });
};

// Add caching for metrics
const metricsCache = new Map();
export const getCallGradeMetrics = async (filters = {}) => {
  const cacheKey = JSON.stringify(filters);
  const cachedData = metricsCache.get(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < 300000) {
    // 5 minutes cache
    return cachedData.data;
  }

  try {
    const metrics = await calculateMetrics(filters);
    metricsCache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now(),
    });
    return metrics;
  } catch (error) {
    console.error("Error getting metrics:", error);
    throw error;
  }
};

// Get grades with filtering options
export const getCallGrades = async (graderId) => {
  try {
    const callGradesRef = collection(db, "callGrades");
    let q;

    if (graderId) {
      q = query(
        callGradesRef,
        where("graderId", "==", graderId),
        orderBy("createdAt", "desc")
      );
    } else {
      // Fallback query if no graderId provided
      q = query(callGradesRef, orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    if (error.code === "failed-precondition") {
      console.log("Index still building, using fallback query");
      // Use a simpler query while index is building
      const snapshot = await getDocs(collection(db, "callGrades"));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    console.error("Error getting call grades:", error);
    throw error;
  }
};

// Helper functions for metrics
const calculateAverageScore = (grades) => {
  if (!grades.length) return 0;
  return (
    grades.reduce((sum, grade) => sum + parseFloat(grade.totalScore), 0) /
    grades.length
  );
};

const calculateSectionScores = (grades) => {
  const sections = {};
  grades.forEach((grade) => {
    Object.entries(grade.scores || {}).forEach(([section, score]) => {
      if (!sections[section]) sections[section] = [];
      sections[section].push(score);
    });
  });

  return Object.entries(sections).reduce(
    (acc, [section, scores]) => ({
      ...acc,
      [section]: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    }),
    {}
  );
};

const calculateTrends = (grades) => {
  // Group grades by week
  const weeklyScores = grades.reduce((acc, grade) => {
    const week = grade.weekNumber;
    const year = grade.year;
    const key = `${year}-${week}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(parseFloat(grade.totalScore));
    return acc;
  }, {});

  // Calculate weekly averages
  return Object.entries(weeklyScores).map(([key, scores]) => ({
    period: key,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
  }));
};

const analyzeStrengths = (grades) => {
  const strengths = grades
    .flatMap((grade) => grade.strengths?.split("\n") || [])
    .reduce((acc, strength) => {
      acc[strength] = (acc[strength] || 0) + 1;
      return acc;
    }, {});

  return Object.entries(strengths)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([strength, count]) => ({ strength, count }));
};

const analyzeImprovements = (grades) => {
  const improvements = grades
    .flatMap((grade) => grade.improvements?.split("\n") || [])
    .reduce((acc, improvement) => {
      acc[improvement] = (acc[improvement] || 0) + 1;
      return acc;
    }, {});

  return Object.entries(improvements)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([improvement, count]) => ({ improvement, count }));
};

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

export const deleteCallGrade = async (gradeId) => {
  try {
    await deleteDoc(doc(db, "callGrades", gradeId));
    return true;
  } catch (error) {
    console.error("Error deleting call grade:", error);
    throw error;
  }
};

// Coaching Sessions Collection
export const addSession = async (coachId, sessionData) => {
  try {
    const sessionRef = await addDoc(collection(db, "sessions"), {
      ...sessionData,
      coachId,
      createdAt: serverTimestamp(),
      status: "scheduled",
    });
    return sessionRef.id;
  } catch (error) {
    console.error("Error adding session:", error);
    throw error;
  }
};

export const getSessions = async (
  userId,
  userRole,
  userLocation,
  userEmail
) => {
  try {
    let q = collection(db, "sessions");

    // Super admin sees everything
    if (isSuperAdmin(userEmail)) {
      q = query(q, orderBy("scheduledDate", "desc"));
    } else if (userRole === "director") {
      // Directors see everything
      q = query(q, orderBy("scheduledDate", "desc"));
    } else if (userRole === "sales_manager") {
      // Sales managers see all in their location
      q = query(
        q,
        where("location", "==", userLocation),
        orderBy("scheduledDate", "desc")
      );
    } else if (userRole === "team_lead") {
      // Team leads see their location
      q = query(
        q,
        where("location", "==", userLocation),
        orderBy("scheduledDate", "desc")
      );
    } else {
      // Agents see only their own
      q = query(
        q,
        where("agentId", "==", userId),
        orderBy("scheduledDate", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting sessions:", error);
    throw error;
  }
};

// Performance Metrics Collection
export const addPerformanceMetric = async (coachId, agentId, metricData) => {
  try {
    const metricRef = await addDoc(collection(db, "performanceMetrics"), {
      coachId,
      agentId,
      ...metricData,
      createdAt: serverTimestamp(),
      period: metricData.period || "monthly",
    });
    return metricRef.id;
  } catch (error) {
    console.error("Error adding performance metric:", error);
    throw error;
  }
};

export const getPerformanceMetrics = async (coachId, agentId = null) => {
  try {
    let q = query(
      collection(db, "performanceMetrics"),
      where("coachId", "==", coachId)
    );

    if (agentId) {
      q = query(q, where("agentId", "==", agentId));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting performance metrics:", error);
    throw error;
  }
};

// User Profiles Collection
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    console.log("Fetching user profile for:", userId); // Debug log
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    console.log("User exists:", userSnap.exists()); // Debug log
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    console.log("No user found for ID:", userId); // Debug log
    return null;
  } catch (error) {
    console.error("Error getting profile:", error.message, error.code); // More detailed error
    throw error;
  }
};

// Add these functions to your existing firebaseUtils.js

export const getUserRole = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data().role?.toLowerCase();
    }
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

export const updateAgent = async (agentId, agentData) => {
  try {
    const agentRef = doc(db, "agents", agentId);
    await updateDoc(agentRef, {
      ...agentData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating agent:", error);
    throw error;
  }
};

export const deleteAgent = async (agentId) => {
  try {
    await deleteDoc(doc(db, "agents", agentId));
    return true;
  } catch (error) {
    console.error("Error deleting agent:", error);
    throw error;
  }
};

export const createUserWithRole = async (userData) => {
  try {
    // Validate required fields first
    if (
      !userData.email ||
      !userData.firstName ||
      !userData.lastName ||
      !userData.role
    ) {
      throw new Error("Missing required user data fields");
    }

    // Create auth user
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password || "Welcome123!" // Provide default password if not specified
    );

    const user = userCredential.user;

    // Prepare user document data with null checks
    const userDoc = {
      uid: user.uid,
      email: userData.email.toLowerCase(),
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      displayName: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      location: userData.location || "",
      createdAt: new Date().toISOString(),
      isActive: true,
      profile: {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email.toLowerCase(),
        role: userData.role,
        location: userData.location || "",
      },
    };

    // Add coachId only if it exists and user is an agent
    if (userData.role === "agent" && userData.coachId) {
      userDoc.coachId = userData.coachId;
      userDoc.profile.coachId = userData.coachId;
    }

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), userDoc);

    // If the user is an agent and has a coach, update the coach's agents list
    if (userData.role === "agent" && userData.coachId) {
      const coachRef = doc(db, "users", userData.coachId);
      await updateDoc(coachRef, {
        agents: arrayUnion(user.uid),
      });
    }

    console.log("User created successfully:", userDoc);

    return {
      user: userCredential.user,
      userData: userDoc,
    };
  } catch (error) {
    console.error("Error in createUserWithRole:", error);
    throw error;
  }
};

// Function to manually add managers
export const addManager = async (managerData) => {
  try {
    const auth = getAuth();

    // Create manager in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      managerData.email,
      // Temporary password
      Math.random().toString(36).slice(-8)
    );

    // Create manager profile in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      firstName: managerData.firstName,
      lastName: managerData.lastName,
      email: managerData.email,
      role: managerData.role, // 'director', 'sales_manager', or 'team_lead'
      location: managerData.location,
      department: managerData.department,
      team: managerData.team,
      createdAt: serverTimestamp(),
      status: "active",
      managerId: managerData.reportsTo, // ID of their manager
    });

    // Send password reset email
    await sendPasswordResetEmail(auth, managerData.email);

    // Also create an agent record for the manager
    const agentRef = await addDoc(collection(db, "agents"), {
      ...managerData,
      userId: userCredential.user.uid,
      createdAt: serverTimestamp(),
      status: "active",
      role: managerData.role,
    });

    return {
      userId: userCredential.user.uid,
      agentId: agentRef.id,
    };
  } catch (error) {
    console.error("Error adding manager:", error);
    throw error;
  }
};

// Example usage for adding the management hierarchy
export const setupManagementHierarchy = async () => {
  try {
    // Add Director
    const director = await addManager({
      firstName: "Chad",
      lastName: "Steadham",
      email: "chad@example.com",
      role: "director",
      location: "All",
      department: "Sales",
      team: "Executive",
      reportsTo: null, // Directors report to no one
    });

    // Add Sales Managers (reporting to Chad)
    const salesManager = await addManager({
      firstName: "Sales",
      lastName: "Manager",
      email: "salesmanager@example.com",
      role: "sales_manager",
      location: "Specific Location",
      department: "Sales",
      team: "Sales Team A",
      reportsTo: director.userId,
    });

    // Add Team Leads (reporting to Sales Manager)
    const teamLead = await addManager({
      firstName: "Team",
      lastName: "Lead",
      email: "teamlead@example.com",
      role: "team_lead",
      location: "Specific Location",
      department: "Sales",
      team: "Team 1",
      reportsTo: salesManager.userId,
    });

    return {
      director,
      salesManager,
      teamLead,
    };
  } catch (error) {
    console.error("Error setting up hierarchy:", error);
    throw error;
  }
};

// Call this function when your app initializes
export const initializeFirebaseAuth = () => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? "User is signed in" : "No user");
    if (user) {
      console.log("User details:", {
        uid: user.uid,
        email: user.email,
      });
    }
  });
};

// Function to bulk add organization data
export const bulkAddOrganization = async (organizationData) => {
  const batch = writeBatch(db);
  const results = {
    success: [],
    errors: [],
  };

  try {
    for (const userData of organizationData) {
      const userRef = doc(collection(db, "users"));
      batch.set(userRef, userData);
      results.success.push(userData.email);
    }

    await batch.commit();
    return results;
  } catch (error) {
    console.error("Error in bulk upload:", error);
    results.errors.push(error.message);
    return results;
  }
};

// Training Materials Collection
export const addTraining = async (trainingData) => {
  try {
    const trainingRef = await addDoc(collection(db, "trainings"), {
      ...trainingData,
      createdAt: serverTimestamp(),
    });
    return trainingRef.id;
  } catch (error) {
    console.error("Error adding training:", error);
    throw error;
  }
};

export const getTrainings = async (userId, userRole) => {
  try {
    let q = collection(db, "trainings");

    if (userRole === "Agent") {
      // Agents only see trainings assigned to them
      q = query(q, where("assignedTo", "array-contains", userId));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting trainings:", error);
    throw error;
  }
};

export const updateTrainingStatus = async (assignmentId, status) => {
  try {
    if (!assignmentId) {
      throw new Error("Assignment ID is required");
    }

    const assignmentRef = doc(assignmentsCollection, assignmentId);
    const updateData = {
      status: status || "pending",
      updatedAt: serverTimestamp(),
    };

    // Only add completedAt if status is explicitly "completed"
    if (status === "completed") {
      updateData.completedAt = serverTimestamp();
    }

    await updateDoc(assignmentRef, updateData);
  } catch (error) {
    console.error("Error updating training status:", error);
    throw error;
  }
};

// Helper function to verify call grade submission
export const verifyCallGrade = async (gradeId) => {
  try {
    const gradeDoc = await getDoc(doc(gradesCollection, gradeId));
    if (gradeDoc.exists()) {
      console.log("Grade verified in Firestore:", gradeDoc.data());
      return true;
    }
    console.error("Grade not found in Firestore");
    return false;
  } catch (error) {
    console.error("Error verifying grade:", error);
    return false;
  }
};

// To test in the browser console:
// 1. Make sure you're logged in
// 2. Run testGrade() in the console
// Example: testGrade()

const calculateMetrics = async (filters) => {
  try {
    const grades = await getCallGrades(filters);

    return {
      totalGrades: grades.length,
      averageScore: calculateAverageScore(grades),
      scoresBySection: calculateSectionScores(grades),
      trends: calculateTrends(grades),
      topStrengths: analyzeStrengths(grades),
      topImprovements: analyzeImprovements(grades),
      recentGrades: grades.slice(0, 5), // Last 5 grades
    };
  } catch (error) {
    console.error("Error calculating metrics:", error);
    throw error;
  }
};

const calculateNewAverage = (newScore) => {
  // This is a simple implementation. You might want to make it more sophisticated
  // by fetching the current average and total grades, then calculating properly
  return {
    value: parseFloat(newScore),
    lastUpdated: serverTimestamp(),
  };
};

export const isSuperAdmin = (email) => {
  console.log("Checking super admin for email:", email);
  const isAdmin = email === "anthony@luminarylife.com";
  console.log("Is super admin result:", isAdmin);
  return isAdmin;
};

export const assignTrainingModule = async (moduleId, selectedAgents) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('No authenticated user found');
    }

    const assignments = selectedAgents.map(async (agentId) => {
      const assignmentData = {
        moduleId,
        agentId,
        assignedBy: auth.currentUser.uid,
        assignedAt: serverTimestamp(),
        status: 'assigned',
        progress: 0
      };

      return await addDoc(collection(db, 'moduleAssignments'), assignmentData);
    });

    await Promise.all(assignments);
    return true;
  } catch (error) {
    console.error('Error assigning module:', error);
    throw error;
  }
};

export const getTrainingModules = async () => {
  try {
    const modulesSnapshot = await getDocs(collection(db, "trainingModules"));
    return modulesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching training modules:", error);
    return [];
  }
};

// Add this to your existing exports
export const getCoaches = async () => {
  try {
    const coachesQuery = query(
      collection(db, "users"),
      where("role", "in", ["coach", "admin"])
    );
    const snapshot = await getDocs(coachesQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching coaches:", error);
    throw error;
  }
};

// Add a function to get agents by coach
export const getAgentsByCoach = async (coachId) => {
  try {
    const agentsQuery = query(
      collection(db, "users"),
      where("coachId", "==", coachId),
      where("role", "==", "agent")
    );
    const snapshot = await getDocs(agentsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching agents by coach:", error);
    throw error;
  }
};

export const getManagers = async () => {
  try {
    const managersQuery = query(
      collection(db, "users"),
      where("role", "==", "sales_manager"),
      orderBy("firstName")
    );

    const snapshot = await getDocs(managersQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching managers:", error);
    throw error;
  }
};

// Get assignments for an agent
export const getAgentAssignments = async (userId) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("No authenticated user found");
    }

    console.log("Fetching assignments for user:", userId);

    const assignmentsQuery = query(
      collection(db, "moduleAssignments"),
      where("agentId", "==", userId)
    );

    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    console.log(
      "Raw assignments snapshot:",
      assignmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );

    const assignments = [];

    for (const docSnapshot of assignmentsSnapshot.docs) {
      const assignment = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      };

      console.log("Processing assignment:", assignment);

      try {
        const moduleRef = doc(db, "trainingModules", assignment.moduleId);
        const moduleDoc = await getDoc(moduleRef);

        if (moduleDoc.exists()) {
          assignment.module = {
            id: moduleDoc.id,
            ...moduleDoc.data(),
          };
          console.log("Found module for assignment:", assignment.module);
        } else {
          console.log("No module found for ID:", assignment.moduleId);
        }
      } catch (error) {
        console.error("Error fetching module details:", error);
      }

      assignments.push(assignment);
    }

    console.log("Final processed assignments:", assignments);
    return assignments;
  } catch (error) {
    console.error("Error getting agent assignments:", error);
    throw error;
  }
};

// Get all assignments for a module
export const getModuleAssignments = async (agentId) => {
  try {
    const assignmentsSnapshot = await getDocs(
      query(
        collection(db, "moduleAssignments"),
        where("agentId", "==", agentId)
      )
    );
    return assignmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching module assignments:", error);
    return [];
  }
};

// Update assignment progress
export const updateAssignmentProgress = async (assignmentId, progress) => {
  try {
    const assignmentRef = doc(db, "moduleAssignments", assignmentId);
    await updateDoc(assignmentRef, {
      progress: progress,
      lastUpdated: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating assignment progress:", error);
    throw error;
  }
};

// Get training analytics
export const getTrainingAnalytics = async (moduleId) => {
  try {
    const assignments = await getModuleAssignments(moduleId);

    return {
      totalAssigned: assignments.length,
      completed: assignments.filter((a) => a.status === "completed").length,
      inProgress: assignments.filter((a) => a.status === "in_progress").length,
      pending: assignments.filter((a) => a.status === "pending").length,
      averageProgress:
        assignments.reduce((acc, curr) => acc + (curr.progress || 0), 0) /
        assignments.length,
      overdue: assignments.filter(
        (a) => a.status !== "completed" && a.dueDate?.toDate() < new Date()
      ).length,
    };
  } catch (error) {
    console.error("Error getting training analytics:", error);
    throw error;
  }
};

// Training Module Management
export const getTrainingAssignments = async () => {
  try {
    const assignmentsRef = collection(db, "training_assignments");
    const querySnapshot = await getDocs(assignmentsRef);

    // Get all assignments
    const assignments = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Get agent details
        const agentDoc = await getDoc(doc(db, "users", data.agentId));
        const agentData = agentDoc.data();

        return {
          id: doc.id,
          ...data,
          agentName: agentData
            ? `${agentData.firstName} ${agentData.lastName}`
            : "Unknown Agent",
          agentEmail: agentData?.email,
        };
      })
    );

    return assignments;
  } catch (error) {
    console.error("Error getting training assignments:", error);
    throw error;
  }
};

export const isDirector = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() && userDoc.data().role === "director";
  } catch (error) {
    console.error("Error checking director status:", error);
    return false;
  }
};

export const getAllModuleAssignments = async () => {
  try {
    const assignmentsSnapshot = await getDocs(
      collection(db, "moduleAssignments")
    );
    const assignments = [];

    for (const docSnapshot of assignmentsSnapshot.docs) {
      const assignment = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      };

      // Get module details
      if (assignment.moduleId) {
        const moduleRef = doc(db, "trainingModules", assignment.moduleId);
        const moduleDoc = await getDoc(moduleRef);
        if (moduleDoc.exists()) {
          assignment.module = {
            id: moduleDoc.id,
            ...moduleDoc.data(),
          };
        }
      }

      // Get agent details
      if (assignment.agentId) {
        const agentRef = doc(db, "users", assignment.agentId);
        const agentDoc = await getDoc(agentRef);
        if (agentDoc.exists()) {
          const agentData = agentDoc.data();
          assignment.agent = {
            id: agentDoc.id,
            ...agentData,
            displayName: `${agentData.firstName || ""} ${
              agentData.lastName || ""
            }`.trim(),
          };
        }
      }

      // Get assigned by user details
      if (assignment.assignedBy) {
        const assignedByRef = doc(db, "users", assignment.assignedBy);
        const assignedByDoc = await getDoc(assignedByRef);
        if (assignedByDoc.exists()) {
          const assignedByData = assignedByDoc.data();
          assignment.assignedByUser = {
            id: assignedByDoc.id,
            ...assignedByData,
            displayName: `${assignedByData.firstName || ""} ${
              assignedByData.lastName || ""
            }`.trim(),
          };
        }
      }

      assignments.push(assignment);
    }

    console.log("Fetched assignments with all details:", assignments);
    return assignments;
  } catch (error) {
    console.error("Error getting all module assignments:", error);
    throw error;
  }
};

export const updateAssignmentStatus = async (assignmentId, status) => {
  try {
    const assignmentRef = doc(db, "moduleAssignments", assignmentId);
    await updateDoc(assignmentRef, {
      status: status,
      lastUpdated: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating assignment status:", error);
    throw error;
  }
};

export const removeModuleAssignment = async (assignmentId) => {
  try {
    const assignmentRef = doc(db, "moduleAssignments", assignmentId);
    await deleteDoc(assignmentRef);
    return true;
  } catch (error) {
    console.error("Error removing module assignment:", error);
    throw error;
  }
};

export const deleteModule = async (moduleId) => {
  try {
    // First, check if the module is assigned to any agents
    const assignmentsQuery = query(
      collection(db, "moduleAssignments"),
      where("moduleId", "==", moduleId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    // If there are assignments, delete them first
    const batch = writeBatch(db);
    assignmentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the module
    const moduleRef = doc(db, "trainingModules", moduleId);
    batch.delete(moduleRef);

    // Commit the batch
    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
};
