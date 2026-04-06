import React from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function App() {
  const [status, setStatus] = React.useState('...');

  React.useEffect(() => {
    fetch(`${API_URL}/api/ping`)
      .then(r => r.json())
      .then(d => setStatus(d.status));
  }, []);

  return <div>API status XX: {status}</div>;
}

export default App;