import React, { useState } from "react";
import { migrateTrainingAssignments } from "../../firebase/migrations";
import { useAuth } from "../../contexts/AuthContext";

const DatabaseMigration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const { currentUser } = useAuth();

  // Only allow super admin to run migrations
  const isSuperAdmin = currentUser?.email === "anthony@luminarylife.com";

  const handleMigration = async () => {
    if (!isSuperAdmin) {
      setStatus("Error: Only super admin can run migrations");
      return;
    }

    // Double confirmation to prevent accidental runs
    if (
      !window.confirm(
        "WARNING: This will migrate all training assignments. Are you sure you want to proceed?"
      )
    ) {
      return;
    }
    if (
      !window.confirm(
        "This operation cannot be undone. Please confirm you have a backup. Continue?"
      )
    ) {
      return;
    }

    setIsLoading(true);
    setStatus("Migration in progress... Please do not close this window.");

    try {
      await migrateTrainingAssignments();
      setStatus(
        "✅ Migration completed successfully! The training assignments have been moved and updated."
      );
    } catch (error) {
      console.error("Migration failed:", error);
      setStatus(
        `❌ Migration failed: ${error.message}. Please check the console for details.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Database Migration</h1>
        <p className="text-red-600">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Database Migration</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-lg font-semibold mb-2">
          Training Assignments Migration
        </h2>
        <div className="text-gray-600 mb-4">
          This will perform the following changes:
          <ul className="list-disc ml-6 mt-2">
            <li>
              Move documents from 'training_assignments' to
              'trainingAssignments'
            </li>
            <li>Update field name from 'agentId' to 'userId'</li>
            <li>Preserve all other data</li>
          </ul>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleMigration}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isLoading ? "Migration in Progress..." : "Run Migration"}
          </button>

          {isLoading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          )}
        </div>
      </div>

      {status && (
        <div
          className={`p-4 rounded-md ${
            status.includes("❌")
              ? "bg-red-100 text-red-700"
              : status.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {status}
        </div>
      )}
    </div>
  );
};

export default DatabaseMigration;
