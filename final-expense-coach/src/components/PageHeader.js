import React from 'react';
import { Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function PageHeader({ title, breadcrumbs }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      {breadcrumbs && (
        <Breadcrumbs>
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={crumb.path}
              component={RouterLink}
              to={crumb.path}
              color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
            >
              {crumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      )}
    </Box>
  );
}

export default PageHeader;