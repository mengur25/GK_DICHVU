import React, { useState } from 'react';
import { Modal, Box, TextField, Button, Typography } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

export default function CreateModal({ open, onClose, onSubmit, fields, title }) {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    setFormData({});
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        {fields.map((field) => (
          <TextField
            key={field.name}
            label={field.label}
            name={field.name}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        ))}
        <Button variant="contained" color="#1e293b" fullWidth onClick={handleSubmit}>
          Create
        </Button>
      </Box>
    </Modal>
  );
}
