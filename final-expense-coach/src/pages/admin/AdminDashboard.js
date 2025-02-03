import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  IconButton,
  Tooltip,
  DialogContentText,
  Container,
  Snackbar,
} from "@mui/material";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import { useAuth } from "../../contexts/AuthContext";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

function AdminDashboard() {
  console.log("AdminDashboard rendering");
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "",
    managerId: "",
  });
  const [managers, setManagers] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        console.log("Current user data:", {
          uid: currentUser.uid,
          email: currentUser.email,
          role: userData?.role,
          isAdmin: ['admin', 'director', 'superadmin'].includes(userData?.role),
          isSuperAdmin: currentUser.email === 'anthony@luminarylife.com'
        });
      } catch (error) {
        console.error("Error checking permissions:", error);
      }
    };
    if (currentUser) {
      checkPermissions();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    console.log("Fetching users...");
    try {
      const db = getFirestore();
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(query(usersRef));

      const usersData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const userData = docSnapshot.data();
        let managerName = "";
        
        // If user has a managerId, fetch manager's name
        if (userData.managerId) {
          const managerRef = doc(db, "users", userData.managerId);
          const managerDoc = await getDoc(managerRef);
          if (managerDoc.exists()) {
            const managerData = managerDoc.data();
            managerName = `${managerData.firstName} ${managerData.lastName}`;
          }
        }

        usersData.push({
          id: docSnapshot.id,
          email: userData.email,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          role: userData.role || "agent",
          createdAt: userData.createdAt,
          managerId: userData.managerId,
          managerName: managerName
        });
      }

      console.log("Processed users:", usersData);
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users: " + error.message);
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const db = getFirestore();
      const managersQuery = query(
        collection(db, "users"),
        where("role", "==", "sales_manager")
      );
      const managersSnapshot = await getDocs(managersQuery);
      const managersData = [];

      managersSnapshot.forEach((doc) => {
        const managerData = doc.data();
        managersData.push({
          id: doc.id,
          name: `${managerData.firstName} ${managerData.lastName}`,
          email: managerData.email,
        });
      });

      console.log("Fetched managers:", managersData);
      setManagers(managersData);
    } catch (error) {
      console.error("Error fetching managers:", error);
      setError("Failed to fetch managers: " + error.message);
    }
  };

  useEffect(() => {
    console.log("AdminDashboard useEffect running");
    fetchUsers();
    fetchManagers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.role) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const auth = getAuth();
      const db = getFirestore();

      // Create auth user first
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      // Create user document
      const newUserData = {
        uid: userCredential.user.uid,
        email: newUser.email,
        firstName: newUser.firstName || "",
        lastName: newUser.lastName || "",
        role: newUser.role,
        managerId: newUser.role === "agent" ? newUser.managerId : null,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
      };

      console.log("Creating new user with data:", newUserData);

      // Create the user document
      await setDoc(doc(db, "users", userCredential.user.uid), newUserData);

      // Reset form and close dialog
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "",
        managerId: "",
      });
      setOpenDialog(false);

      // Refresh users list
      await fetchUsers();
      
      setSnackbar({
        open: true,
        message: 'User created successfully',
        severity: 'success'
      });

    } catch (error) {
      console.error("Error creating user:", error);
      let errorMessage = error.message;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered.';
      }
      
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    try {
      setError("");
      const db = getFirestore();
      const userRef = doc(db, "users", selectedUser.id);

      await updateDoc(userRef, {
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        role: selectedUser.role,
        managerId:
          selectedUser.role === "agent" ? selectedUser.managerId : null,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
      });

      setOpenEditDialog(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user: " + error.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setError("");
      const db = getFirestore();
      const auth = getAuth();

      // Delete from Firestore
      await deleteDoc(doc(db, "users", selectedUser.id));

      // Attempt to delete from Authentication (may fail if user not found)
      try {
        const userToDelete = auth.currentUser; // This needs to be adjusted for admin deletion
        if (userToDelete) {
          await deleteUser(userToDelete);
        }
      } catch (authError) {
        console.warn("Auth user may have already been deleted:", authError);
      }

      setOpenDeleteDialog(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user: " + error.message);
    }
  };

  const renderEditFields = () => {
    if (!selectedUser) return null;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
        <TextField label="Email" value={selectedUser?.email || ""} disabled />
        <TextField
          label="First Name"
          value={selectedUser?.firstName || ""}
          onChange={(e) =>
            setSelectedUser({
              ...selectedUser,
              firstName: e.target.value,
            })
          }
        />
        <TextField
          label="Last Name"
          value={selectedUser?.lastName || ""}
          onChange={(e) =>
            setSelectedUser({
              ...selectedUser,
              lastName: e.target.value,
            })
          }
        />
        <FormControl>
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedUser?.role || ""}
            onChange={(e) =>
              setSelectedUser({
                ...selectedUser,
                role: e.target.value,
                managerId:
                  e.target.value !== "agent" ? null : selectedUser.managerId,
              })
            }
            label="Role"
          >
            <MenuItem value="agent">Agent</MenuItem>
            <MenuItem value="sales_manager">Sales Manager</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>

        {selectedUser.role === "agent" && (
          <FormControl>
            <InputLabel>Assign to Manager</InputLabel>
            <Select
              value={selectedUser?.managerId || ""}
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  managerId: e.target.value,
                })
              }
              label="Assign to Manager"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {managers.map((manager) => (
                <MenuItem key={manager.id} value={manager.id}>
                  {manager.name} ({manager.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    );
  };

  console.log("Current state:", { loading, error, users });

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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Grid container justifyContent="space-between" alignItems="center" mb={4}>
                <Grid item>
                  <Typography variant="h4">User Management</Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenDialog(true)}
                  >
                    Create New User
                  </Button>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {users.length === 0 ? (
                <Typography variant="body1">No users found</Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Manager</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            {user.role === "agent" &&
                              (managers.find((m) => m.id === user.managerId)?.name ||
                                "Unassigned")}
                          </TableCell>
                          <TableCell>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit User">
                              <IconButton
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenEditDialog(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton
                                onClick={() => {
                                  setSelectedUser(user);
                                  setOpenDeleteDialog(true);
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>Create New User</DialogTitle>
                <DialogContent>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                    <TextField
                      label="Email"
                      required
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                    <TextField
                      label="Password"
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                    />
                    <TextField
                      label="First Name"
                      value={newUser.firstName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, firstName: e.target.value })
                      }
                    />
                    <TextField
                      label="Last Name"
                      value={newUser.lastName}
                      onChange={(e) =>
                        setNewUser({ ...newUser, lastName: e.target.value })
                      }
                    />
                    <FormControl required>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={newUser.role}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            role: e.target.value,
                            managerId:
                              e.target.value !== "agent" ? null : newUser.managerId,
                          })
                        }
                        label="Role"
                      >
                        <MenuItem value="agent">Agent</MenuItem>
                        <MenuItem value="sales_manager">Sales Manager</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                    {newUser.role === "agent" && (
                      <FormControl>
                        <InputLabel>Assign to Manager</InputLabel>
                        <Select
                          value={newUser.managerId}
                          onChange={(e) =>
                            setNewUser({ ...newUser, managerId: e.target.value })
                          }
                          label="Assign to Manager"
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {managers.map((manager) => (
                            <MenuItem key={manager.id} value={manager.id}>
                              {manager.name} ({manager.email})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                  <Button
                    onClick={handleCreateUser}
                    variant="contained"
                    color="primary"
                  >
                    Create
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={openEditDialog}
                onClose={() => setOpenEditDialog(false)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>{renderEditFields()}</DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                  <Button onClick={handleEditUser} variant="contained" color="primary">
                    Save Changes
                  </Button>
                </DialogActions>
              </Dialog>

              <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
              >
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Are you sure you want to delete {selectedUser?.firstName}{" "}
                    {selectedUser?.lastName}? This action cannot be undone.
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                  <Button onClick={handleDeleteUser} variant="contained" color="error">
                    Delete
                  </Button>
                </DialogActions>
              </Dialog>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default AdminDashboard;
