import React from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

function SearchBar({ value, onChange, onClear, placeholder = 'Search...' }) {
  return (
    <Paper
      component="form"
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        mb: 2
      }}
    >
      <SearchIcon sx={{ ml: 1, color: 'text.secondary' }} />
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {value && (
        <IconButton size="small" onClick={onClear}>
          <ClearIcon />
        </IconButton>
      )}
    </Paper>
  );
}

export default SearchBar;