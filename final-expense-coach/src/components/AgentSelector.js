import React from "react";
import { Autocomplete, TextField, Chip } from "@mui/material";

function AgentSelector({ agents, selectedAgents, onChange }) {
  return (
    <Autocomplete
      multiple
      id="agent-selector"
      options={agents}
      value={selectedAgents
        .map((agentId) => agents.find((agent) => agent.id === agentId) || null)
        .filter(Boolean)}
      onChange={(event, newValue) => {
        onChange(newValue.map((agent) => agent.id));
      }}
      getOptionLabel={(option) =>
        `${option.firstName} ${option.lastName} (${option.email})`
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label="Select Agents"
          placeholder="Search agents..."
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            label={`${option.firstName} ${option.lastName}`}
            {...getTagProps({ index })}
            onDelete={() => {
              const newSelected = selectedAgents.filter(
                (id) => id !== option.id
              );
              onChange(newSelected);
            }}
          />
        ))
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  );
}

export default AgentSelector;
