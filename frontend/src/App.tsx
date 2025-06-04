import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EmailList from './components/EmailList';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<EmailList />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;